const apiField = document.getElementById("api-field");

document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get("apiKey", (result) => {
    const apiKey = result.apiKey;

    if (!apiKey) {
      addApiField(apiField);
    } else {
      displayApiKey(apiField, apiKey);
    }
  });
});

function addApiField() {
  const apiHeding = document.createElement("div");
  apiHeding.innerHTML = "Enter API Key";
  apiHeding.classList.add("api-heading");
  apiField.appendChild(apiHeding);
  const inputDiv = document.createElement("div");
  const apiInputField = document.createElement("input");
  apiField.classList.add("api-input");
  apiField.appendChild(apiInputField);
  apiField.id = "input-text";

  const saveButton = document.createElement("button");
  saveButton.innerHTML = "Save";
  saveButton.classList.add("api-save-button");
  apiField.appendChild(saveButton);

  saveButton.addEventListener("click", () => {
    const enteredKey = apiInputField.value;
    if (enteredKey) {
      chrome.storage.local.set({ apiKey: enteredKey }, () => {
        apiField.innerHTML = "";
        displayApiKey(apiField, enteredKey);
      });
    }
  });
}

function displayApiKey(apiField, apiKey) {
  const apiKeyDisplay = document.createElement("div");
  apiKeyDisplay.innerHTML = `Your API Key: <strong>${apiKey}</strong>`;
  apiKeyDisplay.classList.add("api-key-display");
  apiField.appendChild(apiKeyDisplay);

  const deleteButton = document.createElement("button");
  deleteButton.innerHTML = "Delete";
  deleteButton.classList.add("api-delete-button");
  apiField.appendChild(deleteButton);

  deleteButton.addEventListener("click", () => {
    chrome.storage.local.remove("apiKey", () => {
      apiField.innerHTML = "";
      addApiField(apiField);
    });
  });
}
