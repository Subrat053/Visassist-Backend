// backend/src/middlewares/auditLog.middleware.js
const AuditLog = require("../models/AuditLog");

exports.auditLogMiddleware = async (req, res, next) => {
  // Store original body for comparison later
  const originalBody = JSON.parse(JSON.stringify(req.body || {}));
  
  // Wrap the res.json to capture response
  const originalJson = res.json;
  
  res.json = function (data) {
    // Call the original json function
    const result = originalJson.call(this, data);
    
    // Log the action if it's a modification
    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method) && req.admin) {
      logAuditTrail(req, data, originalBody).catch(console.error);
    }
    
    return result;
  };
  
  next();
};

async function logAuditTrail(req, responseData, originalBody) {
  try {
    const action = getActionFromMethod(req.method);
    const resource = getResourceFromPath(req.path);
    const resourceId = getResourceIdFromPath(req.path);

    // Only log if response is successful
    if (responseData?.success === false) {
      return;
    }

    const auditLog = new AuditLog({
      adminId: req.admin._id,
      action,
      resource,
      resourceId,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get("user-agent"),
      status: "success",
      details: `Admin ${req.admin.name} performed ${action} on ${resource}`,
    });

    // Calculate changes for update actions
    if (action === "update" && originalBody && responseData?.data) {
      const changes = {};
      
      Object.keys(originalBody).forEach((key) => {
        if (originalBody[key] !== responseData.data[key]) {
          changes[key] = {
            from: originalBody[key],
            to: responseData.data[key],
          };
        }
      });

      if (Object.keys(changes).length > 0) {
        auditLog.changes = changes;
      }
    }

    await auditLog.save();
  } catch (error) {
    console.error("Error logging audit trail:", error);
  }
}

function getActionFromMethod(method) {
  const methodMap = {
    POST: "create",
    GET: "read",
    PUT: "update",
    PATCH: "update",
    DELETE: "delete",
  };
  return methodMap[method] || "read";
}

function getResourceFromPath(path) {
  const segments = path.split("/").filter(Boolean);
  // Get the resource type from URL (e.g., /admin/users -> users)
  const resource = segments[segments.length - 1] || "unknown";
  
  // Capitalize and singularize
  const resourceMap = {
    users: "User",
    consultations: "Consultation",
    countries: "Country",
    visas: "Visa",
    jobs: "Job",
    courses: "Course",
    universities: "University",
    blog: "BlogPost",
    admins: "Admin",
    payments: "Payment",
  };
  
  return resourceMap[resource] || "Unknown";
}

function getResourceIdFromPath(path) {
  const segments = path.split("/").filter(Boolean);
  // UUID pattern (basic check)
  const resourceId = segments.find((segment) => 
    /^[0-9a-f]{24}$/i.test(segment) || 
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)
  );
  
  return resourceId || null;
}
