$(function () {
    $(".highlight").each(function (i, e) {
        let highlightText = $(e).data('highlight');

        if (highlightText) {
            let originalText = $(e).text();

            //html 태그 삽입 방지
            originalText = originalText.replace(new RegExp("<", "g"), "&lt;");
            originalText = originalText.replace(new RegExp(">", "g"), "&gt;");

            let newText = originalText;
            let matches = originalText.match(new RegExp(highlightText, "ig"));
            if (matches !== null) {
                matches = distinct(matches);
                matches.forEach(function (match) {
                    newText = newText.replace(new RegExp(match, 'g'), "<span class='searchHighlight'>" + match + "</span>");
                });
            }

            $(e).html(newText);
        }
    });

    function distinct(array) {
        let ret = [];

        for (i = 0; i < array.length; i++) {
            if (array.indexOf(array[i]) == i)
                ret.push(array[i]);
        }

        return ret;
    }
});