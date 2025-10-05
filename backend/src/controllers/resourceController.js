const Resource = require("../models/Resource");

// Get all resources with filtering and pagination
exports.getAllResources = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      category,
      search,
      featured,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    const query = { isPublished: true };

    // Apply filters
    if (type) query.type = type;
    if (category) query.category = category;
    if (featured !== undefined) query.featured = featured === "true";
    if (search) {
      query.$text = { $search: search };
    }

    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const resources = await Resource.find(query)
      .populate("author", "fullName email")
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Resource.countDocuments(query);

    res.json({
      resources,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalResources: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Get single resource
exports.getResource = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id)
      .populate("author", "fullName email")
      .lean();

    if (!resource || !resource.isPublished) {
      return res.status(404).json({ message: "Resource not found" });
    }

    // Increment view count
    await Resource.findByIdAndUpdate(req.params.id, {
      $inc: { viewCount: 1 },
    });

    res.json(resource);
  } catch (err) {
    next(err);
  }
};

// Create new resource (Admin only)
exports.createResource = async (req, res, next) => {
  try {
    const {
      title,
      description,
      type,
      content,
      videoUrl,
      thumbnailUrl,
      tags,
      category,
      featured,
    } = req.body;

    const resourceData = {
      title,
      description,
      type,
      category,
      author: req.user.id,
      tags: tags || [],
      featured: featured || false,
    };

    if (type === "video") {
      resourceData.videoUrl = videoUrl;
    } else {
      resourceData.content = content;
    }

    if (thumbnailUrl) {
      resourceData.thumbnailUrl = thumbnailUrl;
    }

    const resource = await Resource.create(resourceData);
    await resource.populate("author", "fullName email");

    res.status(201).json(resource);
  } catch (err) {
    next(err);
  }
};

// Update resource (Admin only)
exports.updateResource = async (req, res, next) => {
  try {
    const {
      title,
      description,
      type,
      content,
      videoUrl,
      thumbnailUrl,
      tags,
      category,
      featured,
      isPublished,
    } = req.body;

    const updateData = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (category !== undefined) updateData.category = category;
    if (tags !== undefined) updateData.tags = tags;
    if (featured !== undefined) updateData.featured = featured;
    if (isPublished !== undefined) updateData.isPublished = isPublished;

    if (type === "video" && videoUrl !== undefined) {
      updateData.videoUrl = videoUrl;
    } else if (content !== undefined) {
      updateData.content = content;
    }

    if (thumbnailUrl !== undefined) {
      updateData.thumbnailUrl = thumbnailUrl;
    }

    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate("author", "fullName email");

    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    res.json(resource);
  } catch (err) {
    next(err);
  }
};

// Delete resource (Admin only)
exports.deleteResource = async (req, res, next) => {
  try {
    const resource = await Resource.findByIdAndDelete(req.params.id);

    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    res.json({ message: "Resource deleted successfully" });
  } catch (err) {
    next(err);
  }
};

// Get admin resources (with unpublished)
exports.getAdminResources = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      category,
      isPublished,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    const query = {};

    // Apply filters
    if (type) query.type = type;
    if (category) query.category = category;
    if (isPublished !== undefined) query.isPublished = isPublished === "true";

    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const resources = await Resource.find(query)
      .populate("author", "fullName email")
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Resource.countDocuments(query);

    res.json({
      resources,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalResources: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Like/Unlike resource
exports.toggleLike = async (req, res, next) => {
  try {
    // For now, just increment/decrement likes
    // In a real app, you'd track which users liked which resources
    const { action } = req.body; // 'like' or 'unlike'
    
    const increment = action === 'like' ? 1 : -1;
    
    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: increment } },
      { new: true }
    );

    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    res.json({ likes: resource.likes });
  } catch (err) {
    next(err);
  }
};
