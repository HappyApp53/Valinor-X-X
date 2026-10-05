# Valinor

Valinor is a Chrome extension that tells you which credit card to use at checkout so you get the most rewards on every purchase.

- The full repo is private. These are a few files pulled from it so you can see how it's built.
- This side of the code is a portion of what I've done. Due to confidential information about the product, I put the little pieces that I dedicated to it.
- Live site: https://valinorexpress.com

## What's in here

- `candidate-hash.ts`: turns the prices we find on a checkout page into one key, so the extension and our server can look up the same saved answer. It ignores the order of the prices, treats USD and EUR as different, and converts to cents so rounding errors can't break it.
- `candidate-hash.test.ts`: the tests for all of that.
- `manifest.json` and `manifest.test.ts`: the extension only asks Chrome for one permission, storage. The test fails if anyone adds more.
- `dom-helpers.ts` and `dom-helpers.test.ts`: small helpers for the panel that pops up on the checkout page.

Happy to give read access to the full repo if you want to see more.
