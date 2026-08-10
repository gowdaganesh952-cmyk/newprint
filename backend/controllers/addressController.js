import Address from "../models/Address.js";

// GET /api/addresses
export const getAddresses = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const addresses = await Address.find({ userId }).sort({ createdAt: -1 });
    
    res.status(200).json({ success: true, addresses });
  } catch (error) {
    console.error("Get Addresses Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch addresses" });
  }
};

// POST /api/addresses
export const addAddress = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { isDefault, ...addressData } = req.body;

    // If setting as default, remove default from others
    if (isDefault) {
      await Address.updateMany({ userId }, { isDefault: false });
    }

    // If this is the user's first address, force it to be default
    const existingCount = await Address.countDocuments({ userId });
    const finalIsDefault = existingCount === 0 ? true : isDefault;

    const newAddress = await Address.create({
      ...addressData,
      userId,
      isDefault: finalIsDefault
    });

    res.status(201).json({ success: true, address: newAddress });
  } catch (error) {
    console.error("Add Address Error:", error);
    res.status(500).json({ success: false, message: "Failed to add address" });
  }
};

// PUT /api/addresses/:id
export const updateAddress = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const addressId = req.params.id;
    const { isDefault, ...updateData } = req.body;

    const address = await Address.findOne({ _id: addressId, userId });
    
    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    if (isDefault && !address.isDefault) {
      await Address.updateMany({ userId }, { isDefault: false });
    }

    const updatedAddress = await Address.findByIdAndUpdate(
      addressId,
      { ...updateData, isDefault },
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, address: updatedAddress });
  } catch (error) {
    console.error("Update Address Error:", error);
    res.status(500).json({ success: false, message: "Failed to update address" });
  }
};

// DELETE /api/addresses/:id
export const deleteAddress = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const addressId = req.params.id;

    const address = await Address.findOneAndDelete({ _id: addressId, userId });

    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    // If we deleted the default address, make the newest remaining address default
    if (address.isDefault) {
      const remainingAddress = await Address.findOne({ userId }).sort({ createdAt: -1 });
      if (remainingAddress) {
        remainingAddress.isDefault = true;
        await remainingAddress.save();
      }
    }

    res.status(200).json({ success: true, message: "Address deleted successfully" });
  } catch (error) {
    console.error("Delete Address Error:", error);
    res.status(500).json({ success: false, message: "Failed to delete address" });
  }
};

// PATCH /api/addresses/:id/default
export const setDefaultAddress = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const addressId = req.params.id;

    const address = await Address.findOne({ _id: addressId, userId });
    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    await Address.updateMany({ userId }, { isDefault: false });
    
    address.isDefault = true;
    await address.save();

    res.status(200).json({ success: true, address });
  } catch (error) {
    console.error("Set Default Address Error:", error);
    res.status(500).json({ success: false, message: "Failed to set default address" });
  }
};