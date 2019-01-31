$(function(){
    $(".checkValidation").on("submit", function(e){
        console.log("Test");
        let cvForm = $(this);
        let isValid = true;

        cvForm.find("input.cvMinLength").each(function(){
            let cvMinLength = $(this);
            let minLength = cvMinLength.attr("cvMinLength");
            let cvMinLenErrMsg = cvMinLength.attr("cvMinLenErrMsg");
            let cvMinLenErrTo = $(cvMinLength.attr("cvMinLenErrTo"));

            if(cvMinLength.val().length < minLength){
                isValid = false;
                cvMinLenErrTo.text(cvMinLenErrMsg);
            }
            else{
                cvMinLenErrTo.text("");
            }
        });

        if(!isValid){
            if(e.preventDefault)
                e.preventDefault();
            else
                return false;
        }
    });
});