import { invoke, isTauri } from "@tauri-apps/api/core"
import { dirname, join } from "@tauri-apps/api/path"
import { save } from "@tauri-apps/plugin-dialog"

const EXPORT_DIRECTORY_STORAGE_KEY = "arxiva.export.directory"

type SaveExportFileOptions = {
  fileName: string
  contents: string
}

type SaveExportFileResult = {
  saved: boolean
  path?: string
}

const downloadInBrowser = (fileName: string, contents: string) => {
  const blob = new Blob([contents], {
    type: "text/csv;charset=utf-8",
  })
  const downloadUrl = URL.createObjectURL(blob)
  const downloadLink = document.createElement("a")

  downloadLink.href = downloadUrl
  downloadLink.download = fileName
  document.body.appendChild(downloadLink)
  downloadLink.click()
  downloadLink.remove()
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000)
}

const writeExportFile = (path: string, contents: string) =>
  invoke("save_export_file", { path, contents })

export async function saveExportFile({
  fileName,
  contents,
}: SaveExportFileOptions): Promise<SaveExportFileResult> {
  if (!isTauri()) {
    downloadInBrowser(fileName, contents)
    return { saved: true }
  }

  const rememberedDirectory = localStorage.getItem(EXPORT_DIRECTORY_STORAGE_KEY)

  if (rememberedDirectory) {
    try {
      const exportPath = await join(rememberedDirectory, fileName)
      await writeExportFile(exportPath, contents)
      return { saved: true, path: exportPath }
    } catch (error) {
      console.warn("Folder ekspor tersimpan tidak dapat digunakan:", error)
      localStorage.removeItem(EXPORT_DIRECTORY_STORAGE_KEY)
    }
  }

  const selectedPath = await save({
    title: "Pilih lokasi penyimpanan hasil export",
    defaultPath: fileName,
    filters: [
      {
        name: "Excel CSV",
        extensions: ["csv"],
      },
    ],
  })

  if (!selectedPath) {
    return { saved: false }
  }

  await writeExportFile(selectedPath, contents)
  localStorage.setItem(
    EXPORT_DIRECTORY_STORAGE_KEY,
    await dirname(selectedPath)
  )

  return { saved: true, path: selectedPath }
}
