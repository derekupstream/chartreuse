export async function requestDownload({ api, fileName }: { api: string; fileName: string }) {
  try {
    await fetch(api, {
      method: 'GET',
    })
      .then(response => {
        if (response.status !== 200) {
          throw new Error('Sorry, I could not find that file.')
        }
        return response.blob()
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.setAttribute('download', fileName)
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        a.remove()
      })
  } catch (e) {
    console.error('error downloading file', e)
  }
}
