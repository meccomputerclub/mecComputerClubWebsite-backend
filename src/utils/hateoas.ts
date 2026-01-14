interface HateoasLinks {
  self: string;
  next?: string;
  prev?: string;
}

export const buildHateoas = (
  baseUrl: string,
  page: number,
  limit: number,
  total: number
): HateoasLinks => {
  const links: HateoasLinks = {
    self: `${baseUrl}?page=${page}&limit=${limit}`,
  };

  const totalPages = Math.ceil(total / limit);

  if (page < totalPages) {
    links.next = `${baseUrl}?page=${page + 1}&limit=${limit}`;
  }

  if (page > 1) {
    links.prev = `${baseUrl}?page=${page - 1}&limit=${limit}`;
  }

  return links;
};
