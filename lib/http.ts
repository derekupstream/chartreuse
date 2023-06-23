type Params = { [key: string]: any };

export function GET<T>(requestURL: string, data: Params = {}): Promise<T> {
  const queryStr = Object.keys(data)
    .filter(key => !!data[key])
    .map(key => `${key}=${encodeURIComponent(data[key])}`)
    .join('&');
  return fetch(requestURL + (queryStr ? '?' + queryStr : ''), {
    method: 'GET',
    headers: new Headers({
      Accept: 'application/json'
    }),
    credentials: 'include'
  }).then(transformResponse);
}

export function DELETE<T>(requestURL: string, data: Params = {}): Promise<T> {
  return fetch(requestURL, {
    body: JSON.stringify(data),
    method: 'DELETE',
    headers: new Headers({
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }),
    credentials: 'include'
  }).then(transformResponse);
}

export function POST<T>(
  requestURL: string,
  data: Params = {},
  { noHeaders }: { noHeaders?: boolean } = {}
): Promise<T> {
  return fetch(requestURL, {
    body: JSON.stringify(data),
    method: 'POST',
    headers: noHeaders
      ? undefined
      : new Headers({
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }),
    credentials: 'include'
  }).then(transformResponse);
}

export function PUT<T>(requestURL: string, data: Params = {}): Promise<T> {
  return fetch(requestURL, {
    body: JSON.stringify(data),
    method: 'PUT',
    headers: new Headers({
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }),
    credentials: 'include'
  }).then(transformResponse);
}

export function uploadFile(requestURL: string, file: File): Promise<any> {
  const formData = new FormData();

  // Update the formData object
  formData.append('upload', file, file.name);

  return fetch(requestURL, {
    body: formData,
    method: 'POST',
    credentials: 'include'
  }).then(transformResponse);
}

function transformResponse(response: Response) {
  if (response.status >= 400) {
    const contentType = response.headers.get('content-type') as string | undefined;
    if (contentType?.includes('application/json')) {
      return response.json().then(json => Promise.reject(json));
    }
    return response.text().then(text => Promise.reject({ status: response.status, error: text }));
  }
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return response.json();
  }
  return response.text().then(response => {
    return response === 'OK' ? null : response;
  });
}
