// backend/src/modules/admin/admin.controller.js
const Admin = require("../../models/Admin");
const AuditLog = require("../../models/AuditLog");
const User = require("../../models/User");
const Consultation = require("../../models/Consultation");
const Country = require("../../models/Country");
const Job = require("../../models/Job");
const Course = require("../../models/Course");
const BlogPost = require("../../models/BlogPost");
const Payment = require("../../models/Payment");
const jwt = require("jsonwebtoken");
const { sendEmail } = require("../../utils/emailService");

// ======================== DASHBOARD ========================

exports.getDashboard = async (req, res) => {
  try {
    const [
      totalUsers,
      totalConsultations,
      totalApplications,
      totalRevenue,
      recentConsultations,
      thisMonthUsers,
      thisMonthConsultations,
      thisMonthRevenue,
    ] = await Promise.all([
      User.countDocuments({ isDeleted: false }),
      Consultation.countDocuments({ isDeleted: false }),
      require("../../models/Application").countDocuments({ isDeleted: false }),
      Payment.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Consultation.find({ isDeleted: false })
        .limit(5)
        .sort({ createdAt: -1 })
        .populate("userId", "firstName lastName email"),
      User.countDocuments({
        isDeleted: false,
        createdAt: { $gte: new Date(new Date().setDate(1)) },
      }),
      Consultation.countDocuments({
        isDeleted: false,
        createdAt: { $gte: new Date(new Date().setDate(1)) },
      }),
      Payment.aggregate([
        {
          $match: {
            status: "completed",
            createdAt: { $gte: new Date(new Date().setDate(1)) },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    const topCountries = await Consultation.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: "$country", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          country: "$_id",
          count: 1,
        },
      },
    ]);

    const conversionRate =
      totalUsers > 0
        ? ((totalConsultations / totalUsers) * 100).toFixed(1)
        : 0;

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalConsultations,
          totalApplications,
          totalRevenue: totalRevenue[0]?.total || 0,
          conversionRate,
        },
        recentConsultations,
        thisMonthStats: {
          newUsers: thisMonthUsers,
          newConsultations: thisMonthConsultations,
          newRevenue: thisMonthRevenue[0]?.total || 0,
        },
        topCountries,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: "DASHBOARD_ERROR",
        message: error.message,
      },
    });
  }
};

// ======================== ANALYTICS ========================

exports.getAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;

    const dateFilter = {
      createdAt: {
        $gte: new Date(startDate || new Date(new Date().setDate(1))),
        $lte: new Date(endDate || new Date()),
      },
    };

    const metrics = {};

    if (!type || type === "users") {
      const newUsers = await User.countDocuments({
        ...dateFilter,
        isDeleted: false,
      });
      const activeUsers = await User.countDocuments({ isDeleted: false });

      metrics.newUsers = newUsers;
      metrics.activeUsers = activeUsers;
      metrics.userGrowthRate = activeUsers > 0 ? newUsers / activeUsers : 0;
    }

    if (!type || type === "consultations") {
      const total = await Consultation.countDocuments({
        ...dateFilter,
        isDeleted: false,
      });
      const completed = await Consultation.countDocuments({
        ...dateFilter,
        status: "completed",
        isDeleted: false,
      });

      metrics.consultationCount = total;
      metrics.conversionRate =
        total > 0 ? ((completed / total) * 100).toFixed(1) : 0;
      metrics.avgProcessingTime = await calculateAvgProcessingTime(dateFilter);
    }

    if (!type || type === "revenue") {
      const revenue = await Payment.aggregate([
        {
          $match: { ...dateFilter, status: "completed" },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);

      metrics.totalRevenue = revenue[0]?.total || 0;
    }

    res.status(200).json({
      success: true,
      data: {
        period: `${startDate} to ${endDate}`,
        metrics,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: "ANALYTICS_ERROR",
        message: error.message,
      },
    });
  }
};

// ======================== USERS ========================

exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status, sortBy } = req.query;
    const skip = (page - 1) * limit;

    const query = { isDeleted: false };

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (status) {
      query.status = status;
    }

    const sortOptions = {};
    if (sortBy === "createdAt") {
      sortOptions.createdAt = -1;
    } else if (sortBy === "name") {
      sortOptions.firstName = 1;
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password_hash")
        .skip(skip)
        .limit(parseInt(limit))
        .sort(sortOptions),
      User.countDocuments(query),
    ]);

    // Populate application counts
    const usersWithCounts = await Promise.all(
      users.map(async (user) => {
        const applicationCount = await require("../../models/Application").countDocuments({
          userId: user._id,
        });
        const consultationCount = await Consultation.countDocuments({
          userId: user._id,
        });

        return {
          ...user.toObject(),
          applications: applicationCount,
          consultations: consultationCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: usersWithCounts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: "USERS_FETCH_ERROR",
        message: error.message,
      },
    });
  }
};

exports.getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select("-password_hash")
      .populate("applications consultations");

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found",
        },
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: "USER_FETCH_ERROR",
        message: error.message,
      },
    });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    const validStatuses = ["active", "inactive", "suspended"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_STATUS",
          message: "Invalid status",
        },
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { status },
      { new: true }
    ).select("-password_hash");

    res.status(200).json({
      success: true,
      message: `User status updated to ${status}`,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: "UPDATE_ERROR",
        message: error.message,
      },
    });
  }
};

// ======================== CONSULTATIONS ========================

exports.getAllConsultations = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      status,
      country,
      adviserId,
      sortBy,
    } = req.query;
    const skip = (page - 1) * limit;

    const query = { isDeleted: false };

    if (type) query.type = type;
    if (status) query.status = status;
    if (country) query.country = country;
    if (adviserId) query.assignedAdviser = adviserId;

    const sortOptions = {};
    if (sortBy === "priority") {
      sortOptions.priority = -1;
    } else {
      sortOptions.createdAt = -1;
    }

    const [consultations, total] = await Promise.all([
      Consultation.find(query)
        .skip(skip)
        .limit(parseInt(limit))
        .sort(sortOptions)
        .populate("userId", "firstName lastName email phone")
        .populate("assignedAdviser", "name email"),
      Consultation.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: consultations,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: "CONSULTATIONS_FETCH_ERROR",
        message: error.message,
      },
    });
  }
};

exports.getConsultationDetails = async (req, res) => {
  try {
    const { consultationId } = req.params;

    const consultation = await Consultation.findById(consultationId)
      .populate("userId")
      .populate("assignedAdviser", "name email");

    if (!consultation) {
      return res.status(404).json({
        success: false,
        error: {
          code: "CONSULTATION_NOT_FOUND",
          message: "Consultation not found",
        },
      });
    }

    res.status(200).json({
      success: true,
      data: consultation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: "CONSULTATION_FETCH_ERROR",
        message: error.message,
      },
    });
  }
};

exports.updateConsultationStatus = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const { status, note } = req.body;

    const consultation = await Consultation.findById(consultationId);

    if (!consultation) {
      return res.status(404).json({
        success: false,
        error: {
          code: "CONSULTATION_NOT_FOUND",
          message: "Consultation not found",
        },
      });
    }

    consultation.status = status;

    if (note) {
      consultation.notes = consultation.notes || [];
      consultation.notes.push({
        text: note,
        addedBy: req.admin._id,
        createdAt: new Date(),
      });
    }

    await consultation.save();

    res.status(200).json({
      success: true,
      message: "Consultation status updated",
      data: consultation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: "UPDATE_ERROR",
        message: error.message,
      },
    });
  }
};

exports.assignConsultant = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const { adviserId } = req.body;

    const consultation = await Consultation.findByIdAndUpdate(
      consultationId,
      { assignedAdviser: adviserId },
      { new: true }
    ).populate("assignedAdviser", "name email");

    // Send email to adviser
    // await sendEmail({...});

    res.status(200).json({
      success: true,
      message: "Consultant assigned successfully",
      data: consultation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: "ASSIGN_ERROR",
        message: error.message,
      },
    });
  }
};

// ======================== REPORTS ========================

exports.getRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate, period = "daily" } = req.query;

    const dateFilter = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
      status: "completed",
    };

    const groupStage = getGroupStageByPeriod(period);

    const report = await Payment.aggregate([
      { $match: dateFilter },
      { $group: { ...groupStage, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const totalRevenue = report.reduce((sum, item) => sum + item.total, 0);
    const totalTransactions = report.reduce((sum, item) => sum + item.count, 0);

    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        transactions: totalTransactions,
        avgTransaction: totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
        chartData: report,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: "REPORT_ERROR",
        message: error.message,
      },
    });
  }
};

// ======================== AUDIT LOGS ========================

exports.getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, action, adminId, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    const query = {};

    if (action) query.action = action;
    if (adminId) query.adminId = adminId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 })
        .populate("adminId", "name email"),
      AuditLog.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: "AUDIT_FETCH_ERROR",
        message: error.message,
      },
    });
  }
};

// Helper functions
async function calculateAvgProcessingTime(dateFilter) {
  const completed = await Consultation.aggregate([
    {
      $match: { ...dateFilter, status: "completed" },
    },
    {
      $group: {
        _id: null,
        avgTime: {
          $avg: {
            $subtract: ["$updatedAt", "$createdAt"],
          },
        },
      },
    },
  ]);

  if (completed[0]?.avgTime) {
    const days = completed[0].avgTime / (1000 * 60 * 60 * 24);
    return days.toFixed(1);
  }

  return 0;
}

function getGroupStageByPeriod(period) {
  const groupBy = {
    daily: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
    weekly: { $week: "$createdAt" },
    monthly: { $month: "$createdAt" },
  };

  return {
    _id: groupBy[period] || groupBy.daily,
  };
}

module.exports = exports;
