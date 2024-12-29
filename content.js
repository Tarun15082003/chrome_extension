const cancelImageURL = chrome.runtime.getURL("/assets/cancel.png");
const sendImageURL = chrome.runtime.getURL("/assets/send.png");
const aiImageURL = chrome.runtime.getURL("/assets/ai.png");
const gifLoader = chrome.runtime.getURL("/assets/loader.gif");
const AZ_PROBLEM_KEY = "AZ_PROBLEM_KEY";

let currentPath = window.location.pathname;
let questionDetails = {};
let problem_scraped = 0;
let data_theme;

injectScript();

window.addEventListener("xhrDataFetched", (e) => {
  const data = e.detail;
  if (data["responseText"]["details"] === "Problem Details") {
    getQuestionDetails(data["responseText"]["data"]);
  }
});

function injectScript() {
  // console.log(`script-injected on  ${window.location.href}`);
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("/inject.js");
  script.onload = () => {
    script.remove();
  };
  document.documentElement.appendChild(script);
}

const observer = new MutationObserver(() => {
  if (currentPath !== window.location.pathname) {
    currentPath = window.location.pathname;
    cleanUp();
  }
  injectScript();
  addDoubtButton();
});

observer.observe(document.body, { childList: true, subtree: true });

const themeObserver = new MutationObserver(() => {
  handleThemeChange();
});

themeObserver.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["data-theme"],
});

handleThemeChange();

function handleThemeChange() {
  const htmlElement = document.documentElement;
  const theme = htmlElement.getAttribute("data-theme");
  if (theme === null) {
    data_theme = "light";
  } else {
    data_theme = theme;
  }
  updateTheme();
}

function updateTheme() {
  const aiAskButton = document.getElementById("ai-ask-button");
  if (aiAskButton) {
    if (data_theme === "dark") aiAskButton.style.color = "white";
    else aiAskButton.style.color = "black";
  }
  const headerContent = document.getElementById("header-element");
  if (headerContent) {
    const strongElement = headerContent.querySelector("strong");
    if (data_theme === "dark") strongElement.style.color = "white";
    else strongElement.style.color = "black";
  }

  inputBox = document.getElementById("input-text");
  if (inputBox) {
    if (data_theme === "dark") {
      inputBox.style.color = "white";
    } else {
      inputBox.style.color = "black";
    }
  }

  displayMessagesBox = document.getElementById("display-messages-box");
  if (displayMessagesBox) {
    for (let i = 0; i < displayMessagesBox.children.length; i++) {
      const msgDiv = displayMessagesBox.children[i].children[0];
      // console.log(msgDiv);
      if (data_theme === "dark") {
        if (msgDiv.msgFrom === "user") {
          msgDiv.style.background = "#707070";
        } else {
          msgDiv.style.background = "#A0A0A0";
        }
      } else {
        if (msgDiv.msgFrom === "user") {
          msgDiv.style.background = "#EFF4FE";
        } else {
          msgDiv.style.background = "#DDF6FF";
        }
      }
    }
  }
}

function onProblemsPage() {
  return window.location.pathname.startsWith("/problems/");
}

addDoubtButton();

function addDoubtButton() {
  if (!onProblemsPage() || document.getElementById("doubt-button")) return;
  console.log("Added doubt button");
  const doubtButton = document.createElement("li");
  doubtButton.id = "doubt-button";
  doubtButton.style.padding = "0.36rem 1rem";
  doubtButton.style.cursor = "pointer";

  doubtButton.classList.add(
    "d-flex",
    "flex-row",
    "rounded-3",
    "dmsans",
    "align-items-center",
    "coding_list__V_ZOZ",
    "doubt-button"
  );

  const aiButton = document.createElement("img");
  aiButton.src = aiImageURL;
  aiButton.style.height = "20px";
  aiButton.style.width = "20px";
  doubtButton.appendChild(aiButton);
  const wrapper = document.createElement("span");
  wrapper.id = "ai-ask-button";
  const textNode = document.createTextNode("Ask AI");
  wrapper.appendChild(textNode);
  if (data_theme === "dark") wrapper.style.color = "white";
  doubtButton.appendChild(wrapper);

  //   doubtButton.textContent = "Ask AI";

  const targetElement = document.getElementsByClassName(
    "d-flex flex-row p-0 gap-2 justify-content-between m-0 hide-scrollbar"
  )[0];

  if (targetElement) {
    targetElement.appendChild(doubtButton);
  } else {
    console.error("Target element not found!");
  }

  doubtButton.addEventListener("click", addChatPanel);
}

function addChatPanel() {
  console.log("Added chat panel button");
  if (document.getElementById("chat-panel")) {
    return;
  }
  const targetElement = document.getElementsByClassName(
    "coding_split__XZJu1 flex-grow-1"
  )[0];

  const scalerBar = document.createElement("div");
  scalerBar.id = "scaler-bar";
  scalerBar.classList.add("gutter", "gutter-horizontal");
  scalerBar.style.width = "10px";

  const chatPanel = document.createElement("div");
  chatPanel.id = "chat-panel";
  chatPanel.classList.add(
    "d-flex",
    "flex-column",
    "coding_responsive_sidepannel__obXtI",
    "coding_border__67f3C",
    "coding_background_color__i8pOX",
    "flex-grow-1",
    "chat-panel"
  );

  chatPanel.style.width = "580px";
  // chatPanel.style.marginLeft = "5px";
  chatPanel.style.display = "flex";
  chatPanel.style.flexDirection = "column";
  chatPanel.style.justifyContent = "space-between";

  populateChatPanel(chatPanel);

  if (targetElement) {
    targetElement.appendChild(scalerBar);
    targetElement.appendChild(chatPanel);

    scalerBar.addEventListener("mousedown", function (e) {
      e.preventDefault();
      isResizing = true;
      initialMouseX = e.clientX;
      initialWidth = parseInt(chatPanel.style.width, 10);
      document.addEventListener("mousemove", (e) =>
        resize(e, initialMouseX, initialWidth)
      );
      document.addEventListener("mouseup", stopResize);
    });
  } else {
    console.error("Target element not found!");
  }
}

function resize(e, initialMouseX, initialWidth) {
  if (!isResizing) {
    return;
  }
  e.preventDefault();
  const container = document.getElementById("chat-panel");
  const deltaX = e.clientX - initialMouseX;
  const finalWidth = initialWidth - deltaX;
  // console.log(e.clientX, initialMouseX, deltaX, initialWidth, finalWidth);
  container.style.width = `${finalWidth}px`;
}

function stopResize() {
  isResizing = false;
  console.log("resizing stoped");
  document.removeEventListener("mousemove", resize);
  document.removeEventListener("mouseup", stopResize);
}

function populateChatPanel(chatPanel) {
  //--------------Adding Header--------------//
  const header = document.createElement("div");
  header.id = "ask-ai-header";
  header.classList.add(
    "coding_nav_bg__HRkIn",
    "p-2",
    "nav",
    "nav-pills",
    "w-100",
    "ask-ai-header"
  );

  header.style.paddingTop = "3px";
  header.style.paddingBottom = "3px";
  header.style.paddingLeft = "3px";
  header.style.paddingRight = "3px";
  header.style.display = "flex";
  header.style.flexDirection = "row";
  header.style.justifyContent = "space-between";

  const headerContent = document.createElement("span");
  headerContent.id = "header-element";
  headerContent.innerHTML = '<strong style="font-size: 20px;">Ask AI</strong>';
  const strongElement = headerContent.querySelector("strong");
  if (data_theme === "dark") strongElement.style.color = "white";
  header.appendChild(headerContent);

  const canelButton = document.createElement("img");
  canelButton.src = cancelImageURL;
  canelButton.style.height = "30px";
  canelButton.style.width = "30px";
  canelButton.style.cursor = "pointer";

  canelButton.addEventListener("click", closeChatPanel);

  header.append(canelButton);

  chatPanel.appendChild(header);

  //-----------------------------//

  //------------------Displaying messages----------------//

  const displayMessagesBox = document.createElement("div");
  displayMessagesBox.id = "display-messages-box";
  displayMessagesBox.style.display = "flex";
  displayMessagesBox.style.flexDirection = "column";
  displayMessagesBox.style.justifyContent = "flex-start";
  displayMessagesBox.style.width = "100%";
  displayMessagesBox.style.height = "100%";
  displayMessagesBox.style.overflowY = "auto";
  displayMessagesBox.style.paddingTop = "5px";
  displayMessagesBox.style.paddingLeft = "5px";
  displayMessagesBox.style.paddingRight = "5px";
  displayMessagesBox.style.paddingBottom = "5px";
  populateMessages(displayMessagesBox);

  chatPanel.appendChild(displayMessagesBox);

  //-----------------------------------------------------//

  //------------Adding Text Box---------------//
  const textBox = document.createElement("div");
  textBox.id = "text-box";
  textBox.classList.add(
    "coding_nav_bg__HRkIn",
    "p-2",
    "nav",
    "nav-pills",
    "w-100",
    "text-box"
  );

  textBox.style.paddingTop = "3px";
  textBox.style.paddingBottom = "3px";
  textBox.style.paddingLeft = "3px";
  textBox.style.paddingRight = "3px";
  textBox.style.display = "flex";
  textBox.style.flexDirection = "row";
  textBox.style.justifyContent = "space-between";

  const textInput = document.createElement("input");
  textInput.id = "input-text";
  textInput.style.width = "90%";
  textInput.style.borderRadius = "10px";
  textInput.style.borderColor = "white";
  textInput.style.outline = "none";
  textInput.style.overflowY = "auto";
  if (data_theme === "dark") {
    textInput.style.color = "white";
  } else {
    textInput.style.color = "black";
  }

  textInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      const message = textInput.value.trim();
      textInput.value = "";
      if (message) addMessageToChatPanel(message);
    }
  });
  textInput.classList.add(
    "coding_responsive_sidepannel__obXtI",
    "coding_border__67f3C",
    "coding_background_color__i8pOX"
  );

  textBox.append(textInput);
  const sendButton = document.createElement("img");
  sendButton.id = "send-button";
  sendButton.src = sendImageURL;
  sendButton.style.height = "25px";
  sendButton.style.width = "25px";
  sendButton.style.cursor = "pointer";

  sendButton.addEventListener("click", sendMessage);
  textBox.append(sendButton);

  chatPanel.appendChild(textBox);
  //----------------------------------//
}

async function sendMessage(event) {
  getConsoleCode();
  const inputElement = event.target.parentNode.firstChild;
  const message = inputElement.value.trim();
  inputElement.value = "";
  if (message) addMessageToChatPanel(message);
}

async function addMessageToChatPanel(message) {
  const sendButton = document.getElementById("send-button");
  sendButton.style.pointerEvents = "none";
  sendButton.style.opacity = "0.5";

  const textInput = document.getElementById("input-text");
  textInput.disabled = true;
  textInput.style.cursor = "not-allowed";

  const displayMessagesBox = document.getElementById("display-messages-box");

  const userQuestionObj = {
    text: message,
    role: "user",
  };

  const id = await saveUserMessage(userQuestionObj);

  if (displayMessagesBox) {
    await refreshMessages(displayMessagesBox);
  }

  const aiAnswerObj = await getResponse(message);

  await saveAIResponse(aiAnswerObj, id);

  if (displayMessagesBox) {
    await refreshMessages(displayMessagesBox, id);
  }

  sendButton.style.pointerEvents = "auto";
  sendButton.style.opacity = "1";
  textInput.disabled = false;
  textInput.style.cursor = "text";
}

function saveUserMessage(userQuestionObj) {
  const azProblemURL = window.location.href;
  const uniqueId = extractProblemName(azProblemURL);

  return new Promise((resolve) => {
    chrome.storage.local.get(["AZ_PROBLEM_KEY"], (result) => {
      const storedData = result.AZ_PROBLEM_KEY || {};

      if (!storedData[uniqueId]) {
        storedData[uniqueId] = {
          url: azProblemURL,
          chatHistory: [],
        };
      }

      const aiAnswerObj = {
        text: "GENERATE_RESPONSE",
        role: "model",
      };

      storedData[uniqueId].chatHistory.push([userQuestionObj, aiAnswerObj]);

      chrome.storage.local.set({ AZ_PROBLEM_KEY: storedData }, () => {
        // console.log(
        //   `Updated chatHistory for ${uniqueId}:`,
        //   storedData[uniqueId].chatHistory
        // );
      });

      resolve(storedData[uniqueId].chatHistory.length);
    });
  });
}

function saveAIResponse(aiAnswerObj, index) {
  const azProblemURL = window.location.href;
  const uniqueId = extractProblemName(azProblemURL);

  return new Promise((resolve) => {
    chrome.storage.local.get(["AZ_PROBLEM_KEY"], (result) => {
      const storedData = result.AZ_PROBLEM_KEY || {};

      if (!storedData[uniqueId]) {
        storedData[uniqueId] = {
          url: azProblemURL,
          chatHistory: [],
        };
      }

      storedData[uniqueId].chatHistory[index - 1][1] = aiAnswerObj;

      chrome.storage.local.set({ AZ_PROBLEM_KEY: storedData }, () => {
        // console.log(
        //   `Updated chatHistory for ${uniqueId}:`,
        //   storedData[uniqueId].chatHistory
        // );
      });

      resolve(storedData[uniqueId].chatHistory.length);
    });
  });
}

function getResponse(message) {
  return new Promise((resolve) => {
    const aiAnswerobj = askAiendpoint(message);
    resolve(aiAnswerobj);
  });
}

async function refreshMessages(displayMessagesBox, index = null) {
  const messages = await getMessages();
  if (index === null) {
    const lastMessage = messages[messages.length - 1];

    const userMsg = lastMessage[0]["text"];
    const aiResponse = lastMessage[1]["text"];

    displayMessagesBox.appendChild(createMessageDiv(userMsg, 1));
    displayMessagesBox.appendChild(createMessageDiv(aiResponse, 0, 1));

    displayMessagesBox.scrollTop = displayMessagesBox.scrollHeight;
  } else {
    const aiMessageIndex = 2 * (index - 1) + 1;

    const aiResponse = messages[index - 1][1]["text"];

    if (displayMessagesBox.children[aiMessageIndex]) {
      const child = displayMessagesBox.children[aiMessageIndex].children[0];

      while (child.firstChild) {
        child.removeChild(child.firstChild);
      }

      child.innerHTML = aiResponse;
    }
  }
}

async function populateMessages(displayMessagesBox) {
  const messages = await getMessages();
  messages.forEach((element) => {
    const userMsg = element[0]["text"];
    const aiResponse = element[1]["text"];
    displayMessagesBox.appendChild(createMessageDiv(userMsg, 1));
    displayMessagesBox.appendChild(createMessageDiv(aiResponse, 0));
  });
  displayMessagesBox.scrollTop = displayMessagesBox.scrollHeight;
}

function createMessageDiv(msg, role, ident = null) {
  const msgOuterContainer = document.createElement("div");
  msgOuterContainer.style.display = "flex";
  msgOuterContainer.style.flexDirection = "row";
  msgOuterContainer.style.marginLeft = "5px";
  msgOuterContainer.style.marginTop = "5px";
  msgOuterContainer.style.marginBottom = "5px";
  msgOuterContainer.style.marginRight = "5px";

  if (role === 0) {
    msgOuterContainer.style.justifyContent = "flex-start";
  } else {
    msgOuterContainer.style.justifyContent = "flex-end";
  }

  const textDiv = document.createElement("div");
  textDiv.style.display = "flex";
  textDiv.style.flexDirection = "row";
  textDiv.style.flexWrap = "wrap";
  textDiv.style.paddingLeft = "10px";
  textDiv.style.paddingTop = "10px";
  textDiv.style.paddingBottom = "10px";
  textDiv.style.paddingRight = "10px";
  textDiv.style.borderRadius = "20px";
  textDiv.style.maxWidth = "90%";

  if (role === 0) {
    textDiv.style.justifyContent = "flex-start";
    if (data_theme === "dark") {
      textDiv.style.background = "#A0A0A0";
    } else {
      textDiv.style.background = "#DDF6FF";
    }
    textDiv.msgFrom = "model";
  } else {
    textDiv.style.justifyContent = "flex-end";
    if (data_theme === "dark") {
      textDiv.style.background = "#707070";
    } else {
      textDiv.style.background = "#EFF4FE";
    }
    textDiv.msgFrom = "user";
  }
  // textDiv.style.width = "50%";
  if (msg == "GENERATE_RESPONSE" && role === 0 && ident === 1) {
    const loading = document.createElement("img");
    loading.src = gifLoader;
    loading.style.height = "20px";
    loading.style.width = "20px";
    textDiv.appendChild(loading);
  } else {
    if (msg == "GENERATE_RESPONSE") msg = "Please Try again";
    textDiv.innerHTML = msg;
  }

  msgOuterContainer.appendChild(textDiv);

  return msgOuterContainer;
}

function getMessages() {
  const azProblemURL = window.location.href;
  const uniqueId = extractProblemName(azProblemURL);
  return new Promise((resolve) => {
    chrome.storage.local.get(["AZ_PROBLEM_KEY"], (result) => {
      const storedData = result.AZ_PROBLEM_KEY || {};

      if (!storedData[uniqueId]) {
        storedData[uniqueId] = {
          url: azProblemURL,
          chatHistory: [],
        };
      }

      resolve(storedData[uniqueId].chatHistory);
    });
  });
}

function closeChatPanel() {
  const chatPanel = document.getElementById("chat-panel");
  const scalerBar = document.getElementById("scaler-bar");
  if (scalerBar) {
    console.log("Removing Scaler bar");
    scalerBar.remove();
  }
  if (chatPanel) {
    console.log("Closing chat Panel ");
    chatPanel.remove();
  }
}

function extractProblemName(url) {
  const startIndex = url.indexOf("problems/") + 9;
  const endIndex = url.indexOf("?", startIndex);
  return endIndex === -1
    ? url.substring(startIndex)
    : url.substring(startIndex, endIndex);
}

function cleanUp() {
  closeChatPanel();
  questionDetails = {};
  problem_scraped = 0;
  const askAIButton = document.getElementById("doubt-button");
  if (askAIButton) {
    askAIButton.remove();
  }
}

function getapiKey() {
  return new Promise((resolve) => {
    chrome.storage.local.get("apiKey", (result) => {
      const apiKey = result.apiKey;
      resolve(apiKey || null);
    });
  });
}

async function askAiendpoint(message) {
  if (!message) return;

  const apiKey = await getapiKey();
  // console.log(apiKey);
  if (!apiKey) {
    return {
      text: "Please Enter API KEY",
      role: "model",
    };
  }
  if (problem_scraped == 0) {
    return {
      text: "Reload the page couldn't get the problem detials",
      role: "model",
    };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const chatHistory = await getMessages();

  const historyParts = [];

  for (let i = 0; i < chatHistory.length - 1; i++) {
    const entry = chatHistory[i];
    historyParts.push({
      parts: [{ text: entry[0]["text"] }],
      role: entry[0]["role"],
    });
    historyParts.push({
      parts: [{ text: entry[1]["text"] }],
      role: entry[1]["role"],
    });
  }

  historyParts.push({
    parts: [{ text: generatePrompt(message) }],
    role: "user",
  });

  // console.log(questionDetails.samples);
  // console.log(questionDetails.hints);

  const requestBody = {
    contents: historyParts,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    // console.log(data);
    const candidate = data?.candidates?.[0];
    if (candidate?.content?.parts?.[0]?.text) {
      return {
        text: marked.parse(candidate.content.parts[0].text.trim()).trim(),
        role: candidate.content.role || "unknown",
      };
    } else {
      console.error("Unexpected response format:", data);
      return {
        text: "Please try again",
        role: "model",
      };
    }
  } catch (error) {
    console.error("Error:", error);
    return {
      text: "Please Try Again",
      role: "model",
    };
  }
}

function getQuestionDetails(data) {
  questionDetails.description = data["body"]
    ? marked.parse(data["body"].trim()).trim()
    : "No description";

  questionDetails.editorialCode =
    data["editorial_code"] &&
    Array.isArray(data["editorial_code"]) &&
    data["editorial_code"][0]?.["code"]
      ? marked.parse(data["editorial_code"][0]["code"])
      : "No editorial code";

  questionDetails.inputFormat = data["input_format"]
    ? marked.parse(data["input_format"])
    : "No input format";

  questionDetails.outputFormat = data["output_format"]
    ? marked.parse(data["output_format"])
    : "No output format";

  questionDetails.samples =
    Array.isArray(data["samples"]) && data["samples"].length > 0
      ? JSON.stringify(data["samples"])
      : "No sample Cases";

  questionDetails.hints =
    typeof data["hints"] === "object" && data["hints"] !== null
      ? Object.entries(data["hints"]).map(([key, value]) => `${key}: ${value}`)
      : "No hints";

  problem_scraped = 1;
  // console.log(questionDetails);
}

function getCurrentLanguage() {
  const main = document.getElementsByClassName(
    "d-flex gap-2 align-items-start flex-grow-1 ant_switch_problem_navbar"
  )[0];
  const text = main.children[0].innerText;
  return text;
}

function extractNumber(str) {
  const parts = str.split("-").pop();
  return parts;
}

function getConsoleCode() {
  const azProblemURL = window.location.href;
  const uniqueId = extractProblemName(azProblemURL);
  const problemID = extractNumber(uniqueId) + "_" + getCurrentLanguage();
  const localStorageCopy = { ...localStorage };
  // console.log(problemID);

  const consoleCode =
    localStorageCopy[
      Object.keys(localStorageCopy).find((key) => key.endsWith(problemID))
    ];
  return consoleCode;
}

function generatePrompt(msg) {
  const consoleCode = getConsoleCode();
  const finalmsg = `

    Question Details: '''
    Description: ${questionDetails.description},
    Editorial Code: ${questionDetails.editorialCode},
    Input Format: ${questionDetails.inputFormat},
    Output Format: ${questionDetails.outputFormat},
    Sample Test Cases: ${questionDetails.samples},
    Hints: ${questionDetails.hints} 
    Code I have written : ${consoleCode}
    '''
  
    Read the Question Detials delimited by triple backticks and follow the mentioned steps.
    1) Carefully read and understand the Description, Input Format, Output Format, Hints, and Editorial Code provided inside the triple backticks
    2) Use the understood solution to solve the sample test cases and verify the outputs match expectations. Solve the sample cases only with your understanding of the solution and only then verify the outputs.
    3) Repeat steps 1 and 2 until the question and solution are fully understood.
    4) Answer only the question asked, using the solution you have understood. Do not describe your understanding.
    Your task is to mentor the user in solving the question. Help user in solving the problem on my own by providing hints based on your understanding.
    Provide the solution only when asked.

  User Question: "${msg}"

  The User Question above delimited by quotes is the question being asked by User. 
  Now answer the question by applying the solution you understood, and following the below mentioned rules. Follow these rules at any cost:
  1)If the text in the quotes is a greeting respond with a greeting. Do not add anything else.
  2)Classify the User Question internally as related or unrelated to Question Details, but do not include the classification in your response.
  4)If the User Question is unrelated, respond with a humorous or comedic remark. Use the provided examples as refence only and generate your own responses. Examples:
    - Ah yes, because clearly, this algorithm holds the secrets to the universe. Step aside, astrophysicists!
    - Sure, let me consult my crystal ball of irrelevant queries for that one.
    - Oh, you wanted life advice? Well, I hear sorting algorithms are great for organizing your thoughts.
    - Of course, because nothing screams 'coding problem' like a deep dive into existential philosophy.
    - Absolutely! This is exactly why they trained me—to tackle unrelated enigmas with grace and a bit of sass.
  5)Use the "Code I have written" only if I ask queries regarding the code I wrote. 
  6)If the question is related to the provided details, respond with the solution derived from your understanding.
  `;

  return finalmsg;
}
