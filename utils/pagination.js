const getPaginationData = async (Model, page, limit, query = {}, populateOptions = []) => {
  const skip = (page - 1) * limit;

  // Get total count of documents based on the query
  const totalDocuments = await Model.countDocuments(query);

  // Create the query builder
  let queryBuilder = Model.find(query).skip(skip).limit(limit);

  // Apply each populate option if provided
  if (populateOptions && Array.isArray(populateOptions)) {
    populateOptions.forEach(option => {
      queryBuilder = queryBuilder.populate(option);
    });
  }

  // Execute the query to fetch data
  const data = await queryBuilder;

  // Calculate pagination values
  const totalPages = Math.ceil(totalDocuments / limit);
  const pagination = {
    total: totalDocuments,
    start: skip + 1,
    end: Math.min(skip + limit, totalDocuments),
    currentPage: page,
    totalPages,
    prevPageUrl: page > 1 ? `${page - 1}` : null,
    nextPageUrl: page < totalPages ? `${page + 1}` : null,
  };

  return { data, pagination };
};

module.exports = getPaginationData;
