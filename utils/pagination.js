const getPaginationData = async (Model, page, limit, query = {}, baseUrl = '/', populateOptions = [], sort = '-createdAt') => {
  const skip = (page - 1) * limit;
  const totalDocuments = await Model.countDocuments(query);

  let queryBuilder = Model.find(query).skip(skip).limit(limit).sort(sort);

  if (populateOptions && Array.isArray(populateOptions)) {
    populateOptions.forEach(option => {
      queryBuilder = queryBuilder.populate(option);
    });
  }

  const data = await queryBuilder;

  const totalPages = Math.ceil(totalDocuments / limit);
  const pagination = {
    total: totalDocuments,
    start: skip + 1,
    end: Math.min(skip + limit, totalDocuments),
    currentPage: page,
    totalPages,
    prevPageUrl: page > 1 ? `${baseUrl}?page=${page - 1}` : null,
    nextPageUrl: page < totalPages ? `${baseUrl}?page=${page + 1}` : null,
  };

  return { data, pagination };
};

module.exports = getPaginationData;
