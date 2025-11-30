const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  getVerse: () => ipcRenderer.invoke("get-verse"),
  getRandomQuestion: () => ipcRenderer.invoke("get-random-question"),
  validateAnswer: (data) => ipcRenderer.invoke("validate-answer", data),
  // gestión de preguntas personales
  questionsCount: () => ipcRenderer.invoke("questions:count"),
  questionsList: () => ipcRenderer.invoke("questions:list"),
  questionsAdd: (data) => ipcRenderer.invoke("questions:add", data),
  questionsDelete: (question) =>
    ipcRenderer.invoke("questions:delete", question),
  // gestión de contraseñas
  pwList: (query) => ipcRenderer.invoke("pw:list", { query }),
  pwGet: (id) => ipcRenderer.invoke("pw:get", id),
  pwAdd: (payload) => ipcRenderer.invoke("pw:add", payload),
  pwUpdate: (payload) => ipcRenderer.invoke("pw:update", payload),
  pwDelete: (id) => ipcRenderer.invoke("pw:delete", id),
  // backup
  backupExport: () => ipcRenderer.invoke("backup:export"),
  backupImport: () => ipcRenderer.invoke("backup:import"),
});
