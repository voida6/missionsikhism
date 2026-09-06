// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { jsonScript } from './json-script.ts';

test('a title cannot close the script tag it sits in', () => {
  const out = jsonScript({ title: 'Khalsa</script><img src=x onerror=alert(1)>' });
  assert.ok(!out.includes('</script>'), 'output still contains a literal </script>');
  assert.ok(!out.includes('<'), 'output still contains a literal <');
});

test('escaping round-trips: the parsed value is unchanged', () => {
  const value = {
    title: 'Vadda Ghallughara </script> <b>',
    nested: [{ summary: '1 < 2 && 3 > 2' }],
    gurmukhi: 'ਵਾਹਿਗੁਰੂ',
  };
  assert.deepEqual(JSON.parse(jsonScript(value)), value);
});

test('ordinary content is left readable', () => {
  assert.equal(jsonScript({ a: 'plain' }), '{"a":"plain"}');
});
