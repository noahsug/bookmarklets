/**
 * Use on "https://messages.google.com/".
 * Brings up the most recent unread message.
 */

const ORIGIN_REGEX = new RegExp('//messages.google.com');
if (!ORIGIN_REGEX.test(document.location.origin)) {
  alert(`Cannot run bookmarklet!\nURL should match "${ORIGIN_REGEX}"`);
  process.exit(1);
}

// milliseconds to wait after scrolling to an already loaded part of the page
const SCROLL_DELAY = 500;
// milliseconds to wait before giving up on loading more messages
const LOAD_TIMEOUT = 3000;

const MESSAGE_SELECTOR = '.text-content';
const UNREAD_MESSAGE_SELECTOR = '.text-content.unread';

async function iterate() {
  const unreadMessage = document.querySelector(UNREAD_MESSAGE_SELECTOR);
  if (unreadMessage) {
    unreadMessage.scrollIntoView();
    unreadMessage.click();
    return;
  }

  const messages = selectAllOrError(MESSAGE_SELECTOR);
  const hasMoreMessages = await loadMoreMessages(messages);

  // stop running if there are no new messages
  if (!hasMoreMessages) return;

  await iterate();
}

// new messages are loaded by scrolling to the top and then scrolling back down to the bottom
async function loadMoreMessages(messages) {
  const firstMessage = messages[0];
  firstMessage.scrollIntoView();
  await delay(SCROLL_DELAY);

  const lastMessage = messages[messages.length - 1];
  lastMessage.scrollIntoView();
  return longPoll(checkForNewMessages, { timeout: LOAD_TIMEOUT });
}

async function checkForNewMessages() {
  const messages = selectAllOrError(MESSAGE_SELECTOR);
  await delay(100);
  const newMessages = selectAllOrError(MESSAGE_SELECTOR);
  return newMessages.length > messages.length;
}

function selectAllOrError(selector) {
  const messages = document.querySelectorAll(selector);
  if (messages.length === 0) {
    throw new Error('unable to find', selector);
  }
  return messages;
}

async function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// calls a function over and over again until it returns true, or until the timeout
async function longPoll(fn, { timeout }) {
  const startTime = Date.now();
  const success = await fn();
  if (success) return true;
  const endTime = Date.now();

  const ellapsed = endTime - startTime + 1;
  if (ellapsed >= timeout) return false;

  return longPoll(fn, { timeout: timeout - ellapsed });
}

(async () => {
  const start = Date.now();
  await iterate();
  const end = Date.now();
  const seconds = (end - start) / 1000;
  console.log(`done in ${seconds.toFixed(1)}s`);
})();
