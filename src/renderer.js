export function render(entries = [], options) {
    var result = { entries: [], layout: null };

    entries.forEach((entry, index) => {
        var offsetStart = options.offsetStart;
        var offsetEnd = options.offsetEnd;
        var evaluatedString;

        // offset required
        if (offsetStart && offsetEnd) {
            if (index >= offsetStart && index <= offsetEnd) {
                if (self.isRelevant(entry, result.entries)) {
                    evaluatedString = self.evaluateStringForEntry(
                        options.entryTemplate, entry
                    );

                    result.entries.push(evaluatedString);
                }
            }
        } else {
            // no offset
            if (self.isRelevant(entry, result.entries)) {
                evaluatedString = self.evaluateStringForEntry(
                    options.entryTemplate, entry
                );

                result.entries.push(evaluatedString);
            }
        }
    });

    if (!!this.options.entryTemplate) {
        // we have an entryTemplate
        result.layout = this.wrapContent(
            this.options.layoutTemplate.replace('{entries}', '<entries></entries>')
        );
    } else {
        // no entryTemplate available
        result.layout = this.wrapContent('<div><entries></entries></div>');
    }

    return result;
};
