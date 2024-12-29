(function () {
  const originalXHROpen = window.XMLHttpRequest.prototype.open;
  const originalXHRSend = window.XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (...args) {
    this._requestInfo = { method: args[0], url: args[1] };
    return originalXHROpen.apply(this, args);
  };

  XMLHttpRequest.prototype.send = function (...args) {
    this.addEventListener("load", function () {
      const data = {
        url: this._requestInfo.url,
        status: this.status,
        responseText: JSON.parse(this.responseText),
      };

      window.dispatchEvent(new CustomEvent("xhrDataFetched", { detail: data }));
    });

    return originalXHRSend.apply(this, args);
  };
})();
