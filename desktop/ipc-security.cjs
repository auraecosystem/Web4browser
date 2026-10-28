'use strict';

function assertTrustedRenderer(event, trustedWebContents, trustedFileUrl) {
  if (!event || event.sender !== trustedWebContents) {
    throw new Error('IPC request rejected: untrusted renderer.');
  }

  const frameUrl = event.senderFrame?.url;
  if (typeof frameUrl !== 'string' || frameUrl !== trustedFileUrl) {
    throw new Error('IPC request rejected: untrusted frame.');
  }
}

module.exports = { assertTrustedRenderer };
