import {HttpClient, HttpHeaders} from "@angular/common/http";
import { Injectable } from "@angular/core";
import {Observable} from "rxjs";


@Injectable({providedIn: 'root'})
export class ContactUsService {

    BASE_URL = "https://prod.inu.gov.gn/pre-registration-contactus";

    constructor(private httpClient: HttpClient) { }

    sendForm(formData: any) {
        const url = this.BASE_URL + "/contact-us";
        const data = {
            "name" : formData.name,
            "email" : formData.email,
            "reason" :  `Accusé de réception - RE:[${formData.reason.toLocaleLowerCase() == 'autre' ? formData.otherReason.toLocaleUpperCase() : formData.reason.toLocaleUpperCase()}]`,
            "sign" : "",
            "message" : `Madame/Monsieur <h3> ${formData.name}, </h3> <p> Nous avons reçu votre message et un membre de notre équipe vous contactera dans les plus bref délais. Ceci est un réponse automatique. </p><p> Votre message: <br><br>&nbsp; &nbsp; À: &nbsp; &nbsp; contact@inu.gov.gn <br>&nbsp; &nbsp; Objet: ${formData.reason} <br>&nbsp; &nbsp; Envoyé: ${this.getDateTime()} <br>&nbsp; &nbsp; Message: ${formData.message.replace("\r\n", "<br />\r\n")} <br></p><p> Cordialement, <br>L'Équipe WURI Guinée </p>`
        };
        return this.httpClient.post(url, data);
    }

    verifyMyCaptcha(token: string): Observable<any> {
        const headers = new HttpHeaders({
            'Content-Type':'application/json; charset=utf-8',
            'token': token
        });
        const url = this.BASE_URL + "/contact-us/captcha";

console.log(url);
        return this.httpClient.post(url, {}, {
            headers: headers
        });
    }

    getDateTime() {
        let date = new Date();

        var mm = date.getMonth() + 1;
        var dd = date.getDate();
        var yyyy = date.getFullYear();

        return [(dd>9 ? '' : '0') + dd, (mm>9 ? '' : '0') + mm, yyyy]
                .join('-');
    }
}
