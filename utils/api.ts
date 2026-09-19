export const fetcher = <T>(...args: [RequestInfo, RequestInit?]): Promise<T> =>
  fetch(...args).then(async (res) => {
    if (!res.ok) {
      const message = await res.text().catch(() => res.statusText);
      throw new Error(message || `Request failed with status ${res.status}`);
    }
    return res.json();
  });
