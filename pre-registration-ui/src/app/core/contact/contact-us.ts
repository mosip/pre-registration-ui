

export interface ContactUsFormControlModal {
    name: string;
    email: string;
    reason: string;
    otherReason: string;
    objet: string,
    message: string;
    captcha: string;
}

export class ContactUs {

    // Dummy reasons
    static Reasons : object[] = [
        { key : "Appréciations", value : "APPRECIATION"},
        { key : "Demande d’information", value : "DEMANDE_INFORMATION"},
        { key : "Incident technique", value : "INCIDENT_TECHNIQUE"},
        { key : "Perte de la carte INU", value : "PERTE_DE_LA_CARTE_INU"},
        { key : "Plaintes et réclamations", value : "PLAINTE_ET_RECLAMATION"},
        { key : "Autres", value : "AUTRE"},
    ];
}
