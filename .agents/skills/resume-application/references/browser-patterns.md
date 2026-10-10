# Browser patterns

Always snapshot after navigation or DOM-changing actions. Maintain a local page state record with URL, visible section, visited sections, collapsed controls, repeaters, required fields, and errors.

For a native select, select the exact visible option and reread the selected label. For a custom combobox, type a search term, inspect the fresh suggestion list, choose an exact match, and reread the input. For date pickers, prefer the site's accessible textbox if available; otherwise open the picker, inspect month/year controls, choose the date, and reread the formatted value. For repeaters, add one entry, fill it, reread it, then add the next. For tabs/accordions, keep a list of opened panels and revisit any panel with required fields.

On errors, preserve the value and record the validation message. Do not repeatedly retry an unknown action. Use task settings for overwrite, draft saving, uploads, and submission.
