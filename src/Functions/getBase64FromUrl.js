// Fetch image from URL and return raw base64 (without data URI prefix)
export async function getBase64FromUrl(url) {
  if (!url) return null
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result // data:<type>;base64,....
        if (typeof result === "string") {
          const commaIndex = result.indexOf(",")
          if (commaIndex >= 0) resolve(result.substring(commaIndex + 1))
          else resolve(result)
        } else {
          resolve(null)
        }
      }
      reader.onerror = e => {
        console.log("getBase64FromUrl reader error", e)
        resolve(null)
      }
      reader.readAsDataURL(blob)
    })
  } catch (e) {
    console.log("getBase64FromUrl error", e)
    return null
  }
}
