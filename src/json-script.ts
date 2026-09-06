/**
 * Serialise a value for embedding inside a <script> tag.
 *
 * `JSON.stringify` escapes what JSON needs, which is not what HTML needs: it
 * leaves `<` alone, so a string containing `</script>` closes the tag early and
 * everything after it is parsed as markup rather than data. Content here
 * arrives by pull request — the README invites editors to change files straight
 * on github.com — so an entry title is untrusted input, not a constant.
 *
 * Replacing every `<` with its unicode escape is valid JSON, parses back to
 * the same string, and makes `</script>` unrepresentable. `&` is left alone:
 * these blocks are raw text elements, so the browser does not decode entities
 * inside them.
 */
export const jsonScript = (value: unknown) =>
  JSON.stringify(value).replace(/</g, '\\u003c');
