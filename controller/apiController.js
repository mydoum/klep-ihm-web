let i = 0;
let j = 0;
const compar = 0.7 ;
let flag = 0 ;
const nbOccurenceForDetection = 2 ;

module.exports = function (answer) {
    console.log("inside module")
    let answerParsed = JSON.parse(answer);

    if (answerParsed.hasOwnProperty('Predictions')) {
        console.log('inside if')
        process(answerParsed)
    } else {
        return "The API didn't answered!"
    }
};

function process(answerParsed) {
    console.log('inside function')
    for (let z = 0 ; z < answerParsed['Predictions'].length ; z++){

        if ( answerParsed['Predictions'][z]['Tag'] === 'bag' ){

            if (answerParsed['Predictions'][z]['Probability'] > compar){
                i++;
                console.log('occurence de bag : ', i);
            }else{
                i = 0;
            }

        } else if (answerParsed['Predictions'][z]['Tag'] === 'suitcase' ){

            if (answerParsed['Predictions'][z]['Probability'] > compar){
                j++;
                console.log('occurence de suitcase : ', j);
            }else {
                j = 0;
            }

        }

        if (i === nbOccurenceForDetection || j === nbOccurenceForDetection){
            flag = 1;
        }


    }

    for (let k = 0 ; k < answerParsed['Predictions'].length ; k++){

        delete answerParsed['Predictions'][k];

    }
    delete answerParsed['Iteration'];
    delete answerParsed['Created'];


    answerParsed['Predictions'].unshift({"Occurence":i });
    answerParsed['Predictions'].unshift({"Tag":"bag"});
    answerParsed['Predictions'].unshift({"Occurence":j });
    answerParsed['Predictions'].unshift({"Tag":"suitcase"});
    answerParsed.status = flag;

    //var objout = JSON.stringify(answer);
    //var out2 = Buffer.from(objout).toString('base64');

    if (flag === 1){
        i = 0;
        j = 0;
        flag = 0;
    }
    console.log(answerParsed);
    return answerParsed
}
