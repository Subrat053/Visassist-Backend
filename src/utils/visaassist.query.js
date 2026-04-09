const { getPagination, getPaginationMeta } = require("./pagination.js");

const buildSearchQuery = (search, fields) => {
  if (!search || !fields?.length) {
    return {};
  }

  const regex = new RegExp(search.trim(), "i");
  return {
    $or: fields.map((field) => ({ [field]: regex })),
  };
};

const pickFilters = (query, allowedFields = []) => {
  const filters = {};
  for (const key of allowedFields) {
    if (query[key] === undefined || query[key] === "") {
      continue;
    }
    filters[key] = query[key];
  }
  return filters;
};

const parseSort = (sortBy = "createdAt", sortOrder = "desc") => {
  return {
    [sortBy]: String(sortOrder).toLowerCase() === "asc" ? 1 : -1,
  };
};

const listWithPagination = async ({ model, filter = {}, query = {}, sort = { createdAt: -1 }, populate = [] }) => {
  const { page, limit, skip } = getPagination(query);

  const listQuery = model.find(filter).sort(sort).skip(skip).limit(limit);
  for (const path of populate) {
    listQuery.populate(path);
  }

  const [items, total] = await Promise.all([listQuery, model.countDocuments(filter)]);

  return {
    items,
    pagination: getPaginationMeta(page, limit, total),
  };
};

module.exports = {
  buildSearchQuery,
  pickFilters,
  parseSort,
  listWithPagination,
};
