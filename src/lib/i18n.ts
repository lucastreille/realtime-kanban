// Internationalization - French & English
export type Language = 'fr' | 'en';

export const translations = {
    fr: {
        rating: {
            title: "Comment s'est passée votre expérience ?",
            subtitle: "Votre avis compte énormément pour nous",
            tapToRate: "Touchez pour noter",
        },
        positive: {
            title: "Merci infiniment ! 🎉",
            subtitle: "Votre satisfaction est notre plus belle récompense",
            shareMessage: "Partagez votre expérience pour aider d'autres clients",
            googleButton: "Laisser un avis Google",
            tripadvisorButton: "Laisser un avis TripAdvisor",
        },
        negative: {
            title: "Nous sommes vraiment désolés",
            subtitle: "Votre retour est précieux pour nous améliorer",
            feedbackOption: "Nous faire part de vos remarques",
            reviewOption: "Laisser un avis public quand même",
            or: "ou",
        },
        feedback: {
            title: "Aidez-nous à nous améliorer",
            placeholder: "Dites-nous ce qui n'a pas fonctionné...",
            emailPlaceholder: "Votre email (optionnel)",
            emailHelper: "Pour vous recontacter si vous le souhaitez",
            submit: "Envoyer mon retour",
            sending: "Envoi en cours...",
        },
        thanks: {
            title: "Merci pour votre retour",
            subtitle: "Nous prenons vos remarques très au sérieux",
            message: "Notre équipe analysera votre feedback avec attention",
        },
        common: {
            poweredBy: "Propulsé par",
        },
    },
    en: {
        rating: {
            title: "How was your experience?",
            subtitle: "Your feedback means the world to us",
            tapToRate: "Tap to rate",
        },
        positive: {
            title: "Thank you so much! 🎉",
            subtitle: "Your satisfaction is our greatest reward",
            shareMessage: "Share your experience to help other customers",
            googleButton: "Leave a Google review",
            tripadvisorButton: "Leave a TripAdvisor review",
        },
        negative: {
            title: "We're truly sorry",
            subtitle: "Your feedback is valuable for our improvement",
            feedbackOption: "Share your concerns with us",
            reviewOption: "Leave a public review anyway",
            or: "or",
        },
        feedback: {
            title: "Help us improve",
            placeholder: "Tell us what went wrong...",
            emailPlaceholder: "Your email (optional)",
            emailHelper: "In case you'd like us to follow up",
            submit: "Send my feedback",
            sending: "Sending...",
        },
        thanks: {
            title: "Thank you for your feedback",
            subtitle: "We take your comments very seriously",
            message: "Our team will carefully review your feedback",
        },
        common: {
            poweredBy: "Powered by",
        },
    },
} as const;

export function getTranslations(lang: Language) {
    return translations[lang] || translations.fr;
}
