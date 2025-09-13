const Material = require('../models/Material');

// Get all materials
exports.getAllMaterials = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = { isActive: true };
    
    if (req.query.type) {
      filter.type = req.query.type;
    }
    
    if (req.query.fiber) {
      filter.fiber = new RegExp(req.query.fiber, 'i');
    }
    
    if (req.query.brand) {
      filter.brand = new RegExp(req.query.brand, 'i');
    }

    if (req.query.search) {
      filter.$or = [
        { name: new RegExp(req.query.search, 'i') },
        { description: new RegExp(req.query.search, 'i') },
        { brand: new RegExp(req.query.search, 'i') },
        { fiber: new RegExp(req.query.search, 'i') }
      ];
    }

    const materials = await Material.find(filter)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Material.countDocuments(filter);

    res.json({
      success: true,
      data: materials,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching materials',
      error: error.message
    });
  }
};

// Get material by ID
exports.getMaterialById = async (req, res) => {
  try {
    const material = await Material.findOne({ _id: req.params.id, isActive: true });

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }

    res.json({
      success: true,
      data: material
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching material',
      error: error.message
    });
  }
};

// Create new material
exports.createMaterial = async (req, res) => {
  try {
    const material = new Material(req.body);
    const savedMaterial = await material.save();

    res.status(201).json({
      success: true,
      message: 'Material created successfully',
      data: savedMaterial
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Material with this name already exists'
      });
    }
    
    res.status(400).json({
      success: false,
      message: 'Error creating material',
      error: error.message
    });
  }
};

// Update material
exports.updateMaterial = async (req, res) => {
  try {
    const material = await Material.findOneAndUpdate(
      { _id: req.params.id, isActive: true },
      req.body,
      { new: true, runValidators: true }
    );

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }

    res.json({
      success: true,
      message: 'Material updated successfully',
      data: material
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Material with this name already exists'
      });
    }
    
    res.status(400).json({
      success: false,
      message: 'Error updating material',
      error: error.message
    });
  }
};

// Soft delete material
exports.deleteMaterial = async (req, res) => {
  try {
    const material = await Material.findOneAndUpdate(
      { _id: req.params.id, isActive: true },
      { isActive: false },
      { new: true }
    );

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }

    res.json({
      success: true,
      message: 'Material deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting material',
      error: error.message
    });
  }
};

// Get material types
exports.getMaterialTypes = async (req, res) => {
  try {
    const types = await Material.distinct('type', { isActive: true });
    
    res.json({
      success: true,
      data: types.filter(type => type) // Remove null/undefined values
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching material types',
      error: error.message
    });
  }
};

// Get material fibers
exports.getMaterialFibers = async (req, res) => {
  try {
    const fibers = await Material.distinct('fiber', { isActive: true });
    
    res.json({
      success: true,
      data: fibers.filter(fiber => fiber) // Remove null/undefined values
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching material fibers',
      error: error.message
    });
  }
};

// Get material brands
exports.getMaterialBrands = async (req, res) => {
  try {
    const brands = await Material.distinct('brand', { isActive: true });
    
    res.json({
      success: true,
      data: brands.filter(brand => brand) // Remove null/undefined values
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching material brands',
      error: error.message
    });
  }
};
