const Internship = require("../models/Internship");
const ScrapedInternship = require("../models/ScrapedInternship");
const User = require("../models/User");

// Create a new internship posting
exports.createInternship = async (req, res, next) => {
  try {
    const internshipData = {
      ...req.body,
      employer: req.user.id,
    };

    // Validate required fields
    const requiredFields = ['title', 'description', 'company', 'location', 'duration', 'stipend', 'startDate', 'endDate', 'applicationDeadline'];
    for (const field of requiredFields) {
      if (!internshipData[field]) {
        return res.status(400).json({ message: `${field} is required` });
      }
    }

    const internship = await Internship.create(internshipData);
    
    // Populate employer details
    await internship.populate('employer', 'fullName email companyDetails');
    
    res.status(201).json({
      message: "Internship posted successfully",
      internship,
    });
  } catch (error) {
    next(error);
  }
};

// Get all internships with filtering and pagination (including scraped internships)
exports.getAllInternships = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      location,
      search,
      status = 'active',
      includeScraped = 'true'
    } = req.query;

    const filter = { status };
    const scrapedFilter = { status: 'active' }; // Only active scraped internships

    // Apply filters
    if (location) {
      filter.location = new RegExp(location, 'i');
      scrapedFilter.location = new RegExp(location, 'i');
    }
    if (search) {
      filter.$text = { $search: search };
      scrapedFilter.$text = { $search: search };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get both regular and scraped internships
    const [regularInternships, scrapedInternships] = await Promise.all([
      Internship.find(filter)
        .populate('employer', 'fullName email companyDetails')
        .sort({ createdAt: -1 })
        .lean(),
      includeScraped === 'true' ? 
        ScrapedInternship.find(scrapedFilter)
          .sort({ lastScraped: -1 })
          .lean() : []
    ]);

    // Combine and format internships
    const allInternships = [
      ...regularInternships.map(internship => ({ ...internship, isScraped: false, source: 'internal' })),
      ...scrapedInternships.map(internship => ({ ...internship, isScraped: true, employer: null }))
    ];

    // Sort combined results by date (most recent first)
    allInternships.sort((a, b) => {
      const dateA = a.createdAt || a.lastScraped;
      const dateB = b.createdAt || b.lastScraped;
      return new Date(dateB) - new Date(dateA);
    });

    // Apply pagination to combined results
    const paginatedInternships = allInternships.slice(skip, skip + parseInt(limit));
    const total = allInternships.length;

    res.json({
      internships: paginatedInternships,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: paginatedInternships.length,
        totalInternships: total,
        regularInternships: regularInternships.length,
        scrapedInternships: scrapedInternships.length
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get internship by ID (handles both regular and scraped internships)
exports.getInternshipById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Try to find in regular internships first
    let internship = await Internship.findById(id)
      .populate('employer', 'fullName email companyDetails');
    
    if (internship) {
      return res.json({ ...internship.toObject(), isScraped: false, source: 'internal' });
    }
    
    // If not found, try scraped internships
    internship = await ScrapedInternship.findById(id);
    
    if (internship) {
      return res.json({ ...internship.toObject(), isScraped: true, employer: null });
    }
    
    return res.status(404).json({ message: "Internship not found" });
  } catch (error) {
    next(error);
  }
};

// Get internships posted by current employer
exports.getEmployerInternships = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const filter = { employer: req.user.id };
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const internships = await Internship.find(filter)
      .populate('employer', 'fullName email companyDetails')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Internship.countDocuments(filter);

    res.json({
      internships,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: internships.length,
        totalInternships: total,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update internship
exports.updateInternship = async (req, res, next) => {
  try {
    const internship = await Internship.findOne({ _id: req.params.id, employer: req.user.id });
    
    if (!internship) {
      return res.status(404).json({ message: "Internship not found or unauthorized" });
    }

    const updatedInternship = await Internship.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('employer', 'fullName email companyDetails');

    res.json({
      message: "Internship updated successfully",
      internship: updatedInternship,
    });
  } catch (error) {
    next(error);
  }
};

// Delete internship
exports.deleteInternship = async (req, res, next) => {
  try {
    const internship = await Internship.findOne({ _id: req.params.id, employer: req.user.id });
    
    if (!internship) {
      return res.status(404).json({ message: "Internship not found or unauthorized" });
    }

    await Internship.findByIdAndDelete(req.params.id);
    
    res.json({ message: "Internship deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// Update internship status
exports.updateInternshipStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!['active', 'closed', 'draft'].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const internship = await Internship.findOne({ _id: req.params.id, employer: req.user.id });
    
    if (!internship) {
      return res.status(404).json({ message: "Internship not found or unauthorized" });
    }

    internship.status = status;
    await internship.save();

    res.json({
      message: "Internship status updated successfully",
      internship,
    });
  } catch (error) {
    next(error);
  }
};

// Get internship statistics for employer
exports.getInternshipStats = async (req, res, next) => {
  try {
    const stats = await Internship.aggregate([
      { $match: { employer: req.user.id } },
      {
        $group: {
          _id: null,
          totalInternships: { $sum: 1 },
          activeInternships: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
          closedInternships: { $sum: { $cond: [{ $eq: ["$status", "closed"] }, 1, 0] } },
          draftInternships: { $sum: { $cond: [{ $eq: ["$status", "draft"] }, 1, 0] } },
        },
      },
    ]);

    const result = stats[0] || {
      totalInternships: 0,
      activeInternships: 0,
      closedInternships: 0,
      draftInternships: 0,
    };

    res.json(result);
  } catch (error) {
    next(error);
  }
};
