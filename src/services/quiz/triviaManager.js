const crypto = require("crypto");


// ==========================================
// CONFIGURATION OPEN TRIVIA DB
// ==========================================

const API_URL =
    "https://opentdb.com/api.php";

const TOKEN_URL =
    "https://opentdb.com/api_token.php";


// ==========================================
// CONFIGURATION TRADUCTION
// ==========================================

const TRANSLATE_URL =
    "https://translate.googleapis.com/translate_a/single";


// ==========================================
// SESSION TOKEN
// ==========================================

let sessionToken = null;


// ==========================================
// QUIZ ACTIFS
// ==========================================

const activeQuizzes =
    new Map();


// ==========================================
// DECODAGE HTML
// ==========================================

function decodeHTML(text) {

    if (!text) {
        return "";
    }

    return text

        .replace(
            /&#(\d+);/g,
            (_, code) =>
                String.fromCharCode(
                    Number(code)
                )
        )

        .replace(
            /&#x([0-9a-f]+);/gi,
            (_, code) =>
                String.fromCharCode(
                    parseInt(
                        code,
                        16
                    )
                )
        )

        .replace(
            /&quot;/g,
            '"'
        )

        .replace(
            /&apos;/g,
            "'"
        )

        .replace(
            /&#039;/g,
            "'"
        )

        .replace(
            /&amp;/g,
            "&"
        )

        .replace(
            /&lt;/g,
            "<"
        )

        .replace(
            /&gt;/g,
            ">"
        )

        .replace(
            /&nbsp;/g,
            " "
        );
}


// ==========================================
// TRADUCTION EN FRANÇAIS
// ==========================================

async function translateToFrench(text) {

    if (!text) {
        return text;
    }


    try {

        const url =
            new URL(
                TRANSLATE_URL
            );


        url.searchParams.set(
            "client",
            "gtx"
        );


        url.searchParams.set(
            "sl",
            "en"
        );


        url.searchParams.set(
            "tl",
            "fr"
        );


        url.searchParams.set(
            "dt",
            "t"
        );


        url.searchParams.set(
            "q",
            text
        );


        const response =
            await fetch(
                url.toString()
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );
        }


        const data =
            await response.json();


        if (
            !Array.isArray(data) ||
            !Array.isArray(data[0])
        ) {

            throw new Error(
                "Réponse de traduction invalide."
            );
        }


        const translated =
            data[0]

                .map(
                    part =>
                        part &&
                        part[0]
                            ? part[0]
                            : ""
                )

                .filter(Boolean)

                .join("");


        if (!translated.trim()) {

            throw new Error(
                "Traduction vide."
            );
        }


        return translated;


    } catch (error) {

        console.error(
            "❌ Erreur traduction :",
            error.message
        );


        // On garde le texte original
        // uniquement si le service
        // de traduction est indisponible.
        return text;
    }
}


// ==========================================
// CRÉER TOKEN
// ==========================================

async function createToken() {

    const response =
        await fetch(
            `${TOKEN_URL}?command=request`
        );


    if (!response.ok) {

        throw new Error(
            "Impossible de contacter Open Trivia DB."
        );
    }


    const data =
        await response.json();


    if (
        data.response_code !== 0
    ) {

        throw new Error(
            "Impossible de créer une session Open Trivia DB."
        );
    }


    sessionToken =
        data.token;


    return sessionToken;
}


// ==========================================
// OBTENIR TOKEN
// ==========================================

async function getToken() {

    if (
        sessionToken
    ) {

        return sessionToken;
    }


    return createToken();
}


// ==========================================
// RESET TOKEN
// ==========================================

async function resetToken() {

    if (
        !sessionToken
    ) {

        return createToken();
    }


    try {

        await fetch(

            `${TOKEN_URL}?command=reset&token=${encodeURIComponent(
                sessionToken
            )}`

        );

    } catch {

        // On recrée quand même
        // une nouvelle session.
    }


    return createToken();
}


// ==========================================
// APPEL OPEN TRIVIA DB
// ==========================================

async function requestQuestion(
    token
) {

    const url =
        `${API_URL}?amount=1&type=multiple&encode=url3986&token=${encodeURIComponent(
            token
        )}`;


    return fetch(
        url
    );
}


// ==========================================
// RECUPERER UNE QUESTION
// ==========================================

async function fetchQuestion() {

    let token =
        await getToken();


    let response =
        await requestQuestion(
            token
        );


    if (!response.ok) {

        throw new Error(
            "Open Trivia DB ne répond pas."
        );
    }


    let data =
        await response.json();


    // ======================================
    // TOKEN INVALIDE
    // ======================================

    if (
        data.response_code === 3
    ) {

        sessionToken =
            null;


        token =
            await createToken();


        response =
            await requestQuestion(
                token
            );


        data =
            await response.json();
    }


    // ======================================
    // TOKEN EPUISE
    // ======================================

    if (
        data.response_code === 4
    ) {

        token =
            await resetToken();


        response =
            await requestQuestion(
                token
            );


        data =
            await response.json();
    }


    // ======================================
    // RATE LIMIT
    // ======================================

    if (
        data.response_code === 5
    ) {

        throw new Error(
            "RATE_LIMIT"
        );
    }


    // ======================================
    // AUTRE ERREUR
    // ======================================

    if (
        data.response_code !== 0 ||
        !data.results ||
        !data.results.length
    ) {

        throw new Error(
            "Aucune question disponible."
        );
    }


    const result =
        data.results[0];


    // ======================================
    // DECODAGE
    // ======================================

    const question =
        decodeHTML(
            decodeURIComponent(
                result.question
            )
        );


    const correctAnswer =
        decodeHTML(
            decodeURIComponent(
                result.correct_answer
            )
        );


    const incorrectAnswers =
        result.incorrect_answers.map(

            answer =>
                decodeHTML(
                    decodeURIComponent(
                        answer
                    )
                )

        );


    // ======================================
    // RÉPONSES ORIGINALES
    // ======================================

    const answers = [

        correctAnswer,

        ...incorrectAnswers

    ];


    // ======================================
    // TRADUCTION QUESTION
    // ======================================

    let translatedQuestion =
        await translateToFrench(
            question
        );


    // ======================================
    // TRADUCTION RÉPONSES
    // ======================================

    const translatedAnswers =
        [];


    for (
        const answer of answers
    ) {

        const translated =
            await translateToFrench(
                answer
            );


        translatedAnswers.push(
            translated
        );
    }


    // ======================================
    // TRADUCTION CATÉGORIE
    // ======================================

    const originalCategory =
        decodeHTML(
            decodeURIComponent(
                result.category
            )
        );


    const translatedCategory =
        await translateToFrench(
            originalCategory
        );


    // ======================================
    // NETTOYAGE
    // ======================================

    translatedQuestion =
        translatedQuestion
            .replace(
                /\s+/g,
                " "
            )
            .trim();


    for (
        let i = 0;
        i < translatedAnswers.length;
        i++
    ) {

        translatedAnswers[i] =
            translatedAnswers[i]
                .replace(
                    /\s+/g,
                    " "
                )
                .trim();
    }


    // ======================================
    // MELANGE DES REPONSES
    // ======================================

    const shuffledAnswers =
        translatedAnswers.map(

            (answer, index) => ({

                answer,

                originalIndex:
                    index

            })

        );


    for (
        let i =
            shuffledAnswers.length - 1;

        i > 0;

        i--
    ) {

        const j =
            Math.floor(
                Math.random() *
                (i + 1)
            );


        [
            shuffledAnswers[i],
            shuffledAnswers[j]
        ] = [

            shuffledAnswers[j],
            shuffledAnswers[i]

        ];
    }


    // ======================================
    // REPONSES FINALES
    // ======================================

    const finalAnswers =
        shuffledAnswers.map(
            item =>
                item.answer
        );


    // ======================================
    // BONNE REPONSE
    // ======================================

    const correct =
        shuffledAnswers.findIndex(

            item =>
                item.originalIndex === 0

        );


    // ======================================
    // RESULTAT FINAL
    // ======================================

    return {

        question:
            translatedQuestion,

        answers:
            finalAnswers,

        correct,

        category:
            translatedCategory,

        difficulty:
            result.difficulty

    };
}


// ==========================================
// CREER UN QUIZ ACTIF
// ==========================================

function createQuiz(
    userId,
    quiz,
    mode
) {

    const key =
        crypto
            .randomBytes(6)
            .toString("hex");


    activeQuizzes.set(

        key,

        {

            userId,

            question:
                quiz.question,

            answers:
                quiz.answers,

            correct:
                quiz.correct,

            category:
                quiz.category,

            difficulty:
                quiz.difficulty,

            mode

        }

    );


    return key;
}


// ==========================================
// RECUPERER QUIZ
// ==========================================

function getQuiz(key) {

    return activeQuizzes.get(
        key
    );
}


// ==========================================
// SUPPRIMER QUIZ
// ==========================================

function deleteQuiz(key) {

    activeQuizzes.delete(
        key
    );
}


// ==========================================
// EXPORT
// ==========================================

module.exports = {

    fetchQuestion,

    createQuiz,

    getQuiz,

    deleteQuiz

};