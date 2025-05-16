import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { TranslateService } from "@ngx-translate/core";
import { DialougComponent } from "src/app/shared/dialoug/dialoug.component";
import { MatDialog } from "@angular/material";
import { AuthService } from "../auth.service";
import { DataStorageService } from "src/app/core/services/data-storage.service";
import { RegistrationService } from "src/app/core/services/registration.service";
import { ConfigService } from "src/app/core/services/config.service";
import * as appConstants from "../../app.constants";
import LanguageFactory from "../../../assets/i18n";
import moment from "moment";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.css"],
})
export class LoginComponent implements OnInit {
  languages: string[] = [];
  inputPlaceholderContact = "Email ID or Phone Number";
  inputPlaceholderOTP = "Enter OTP";
  disableBtn = false;
  timer: any;
  inputOTP: string;
  inputContactDetails = "";
  secondaryLangCode = "";
  secondaryDir = "";
  selectedLanguage = "";
  langCode = "";
  dir = "";
  primaryLangFromConfig = "";
  primaryLang = "";
  secondaryLangFromConfig = "";
  defaultLangCode = appConstants.DEFAULT_LANG_CODE;
  secondaryLang = "";
  showSendOTP = true;
  showResend = false;
  loadingMessage: string;
  showVerify = false;
  showContactDetails = true;
  showOTP = false;
  disableVerify = false;
  secondaryLanguagelabels: any;
  loggedOutLang: string;
  errorMessage: string;
  minutes: string;
  seconds: string;
  showSpinner = true;
  validationMessages = {};
  textDir = localStorage.getItem("dir");
  LANGUAGE_ERROR_TEXT =
    "The system has encountered a technical error. Administrator to setup the necessary language configuration(s)";
  siteKey: any;
  enableCaptcha = false;
  enableSendOtp: boolean;
  showCaptcha: boolean = true;
  captchaError: boolean;
  captchaToken = null;
  resetCaptcha: boolean;
  constructor(
    private authService: AuthService,
    private router: Router,
    private translate: TranslateService,
    private dialog: MatDialog,
    private dataService: DataStorageService,
    private regService: RegistrationService,
    private configService: ConfigService
  ) {
    translate.setDefaultLang("eng");
    // localStorage.clear();
  }

  ngOnInit() {
    localStorage.setItem("langCode", "eng");
    this.showSpinner = true;
    //this.loadConfigs();
    if (this.authService.isAuthenticated()) {
      this.authService.onLogout();
    }
    this.loadConfigs();
    if (this.router.url.includes(`${localStorage.getItem("langCode")}`)) {
      this.handleBrowserReload();
    }
  }

  handleBrowserReload() {
    let otp_sent_time = null;
    if (localStorage.getItem("otp_sent_time") != null) {
      otp_sent_time = localStorage.getItem("otp_sent_time").endsWith("Z")
        ? localStorage.getItem("otp_sent_time")
        : localStorage.getItem("otp_sent_time") + "Z";
    }
    const user_email_or_phone = localStorage.getItem("user_email_or_phone");
    console.log(`otp_sent_time: ${otp_sent_time}`);
    if (otp_sent_time && user_email_or_phone) {
      let otpSentTime = moment(otp_sent_time).toISOString();
      //console.log(`otpSentTime: ${otpSentTime}`);
      let currentTime = moment().toISOString();
      //console.log(`currentTime: ${currentTime}`);
      let otpExpiryIntervalInSeconds = Number(
        this.configService.getConfigByKey(
          appConstants.CONFIG_KEYS.mosip_kernel_otp_expiry_time
        )
      );
      if (isNaN(otpExpiryIntervalInSeconds)) {
        otpExpiryIntervalInSeconds = 120; //2 mins by default
      }
      //console.log(`otpExpiryIntervalInSeconds: ${otpExpiryIntervalInSeconds}`);
      var timeLapsedInSeconds = moment(currentTime).diff(
        moment(otpSentTime),
        "seconds"
      );
      //console.log(`timeLapsedInSeconds: ${timeLapsedInSeconds}`);
      if (timeLapsedInSeconds <= otpExpiryIntervalInSeconds) {
        console.log("otp interval not yet expired");
        //console.log(this.timer);
        let newOtpIntervalInSeconds =
          otpExpiryIntervalInSeconds - timeLapsedInSeconds;
        console.log(`newOtpIntervalInSeconds: ${newOtpIntervalInSeconds}`);
        if (JSON.parse(localStorage.getItem("show_captcha"))) {
          this.showCaptcha = true;
        } else {
          this.showCaptcha = false;
        }
        this.errorMessage = "";
        this.inputOTP = "";
        //this.showResend = false;
        this.showOTP = true;
        this.showSendOTP = false;
        this.showContactDetails = false;
        this.enableSendOtp = false;
        this.inputContactDetails = user_email_or_phone;
        let mins = 0;
        if (newOtpIntervalInSeconds >= 60) {
          mins = newOtpIntervalInSeconds / 60;
          mins = Math.floor(mins);
        }
        if (mins < 10) {
          this.minutes = "0" + mins;
        } else {
          this.minutes = String(mins);
          // document.getElementById("minutesSpan")!.innerText = this.minutes;
        }
        let secs = newOtpIntervalInSeconds % 60;
        if (secs < 10) {
          this.seconds = "0" + secs;
        } else {
          this.seconds = String(secs);
          // document.getElementById("secondsSpan")!.innerText = this.seconds;
        }
        this.timer = setInterval(this.timerFn, 1000);
      } else {
        console.log("otp interval expired");
        localStorage.removeItem("otp_sent_time");
        localStorage.removeItem("user_email_or_phone");
        localStorage.removeItem("show_captcha");
      }
    }
  }

  timerFn = () => {
    let secValue,
      minValue = 0;
    if (
      document.getElementById("timer") &&
      document.getElementById("timer").style.visibility == "visible" &&
      document.getElementById("secondsSpan") &&
      document.getElementById("secondsSpan").innerText &&
      document.getElementById("minutesSpan") &&
      document.getElementById("minutesSpan").innerText
    ) {
      secValue = Number(document.getElementById("secondsSpan").innerText);
      minValue = Number(document.getElementById("minutesSpan").innerText);
    } else {
      secValue = Number(this.seconds);
      minValue = Number(this.minutes);
      if (document.getElementById("timer")) {
        document.getElementById("timer").style.visibility = "visible";
      }
    }
    if (secValue === 0) {
      secValue = 60;
      if (minValue === 0) {
        // console.log("redirecting to initial phase on completion of timer");
        // redirecting to initial phase on completion of timer
        this.showContactDetails = true;
        this.showSendOTP = true;
        //this.showResend = true;
        this.showOTP = false;
        this.showVerify = false;
        this.enableSendOtp = true;
        if (this.enableCaptcha) {
          this.showCaptcha = true;
          this.enableSendOtp = false;
        }
        if (document.getElementById("minutesSpan")) {
          document.getElementById("minutesSpan").innerText = this.minutes;
        }
        if (document.getElementById("timer")) {
          document.getElementById("timer").style.visibility = "hidden";
        }
        clearInterval(this.timer);
        return;
  }
      if (document.getElementById("minutesSpan") &&
        document.getElementById("minutesSpan").innerText) {
        document.getElementById("minutesSpan").innerText = "0" + (minValue - 1);
      }
    }
   if (document.getElementById("secondsSpan") &&
      document.getElementById("secondsSpan").innerText) {
      if (secValue === 10 || secValue < 10) {
        document.getElementById("secondsSpan").innerText = "0" + --secValue;
      } else {
        document.getElementById("secondsSpan").innerText = --secValue + "";
      }
    }
  };

  loadValidationMessages() {
    let factory = new LanguageFactory(localStorage.getItem("langCode"));
    let response = factory.getCurrentlanguage();
    this.validationMessages = response["login"];
  }

  loginIdValidator() {
    this.errorMessage = "";
    const modes = this.configService.getConfigByKey(
      appConstants.CONFIG_KEYS.mosip_login_mode
    );
    const emailRegex = new RegExp(
      this.configService.getConfigByKey(
        appConstants.CONFIG_KEYS.mosip_regex_email
      )
    );
    const phoneRegex = new RegExp(
      this.configService.getConfigByKey(
        appConstants.CONFIG_KEYS.mosip_regex_phone
      )
    );
    if (modes === "email,mobile") {
      if (
        !(
          emailRegex.test(this.inputContactDetails) ||
          phoneRegex.test(this.inputContactDetails)
        )
      ) {
        this.errorMessage = this.validationMessages["invalidInput"];
      }
    } else if (modes === "email") {
      if (!emailRegex.test(this.inputContactDetails)) {
        this.errorMessage = this.validationMessages["invalidEmail"];
      }
    } else if (modes === "mobile") {
      if (!phoneRegex.test(this.inputContactDetails)) {
        this.errorMessage = this.validationMessages["invalidMobile"];
      }
    }
  }

  loadConfigs() {
    this.dataService.getConfig().subscribe(
      (response) => {
        this.configService.setConfig(response);
        // this.setTimer();
        this.loadLanguagesWithConfig();
        this.isCaptchaEnabled();
      },
      (error) => {
        this.showErrorMessage();
      }
    );
  }

  isCaptchaEnabled() {
    if (
      this.configService.getConfigByKey(
        "mosip.preregistration.captcha.enable"
      ) === "false" ||
      this.configService.getConfigByKey(
        "mosip.preregistration.captcha.enable"
      ) === undefined
    ) {
      this.enableCaptcha = false;
    } else if (
      this.configService.getConfigByKey(
        "mosip.preregistration.captcha.enable"
      ) === "true"
    ) {
      this.enableCaptcha = true;
      this.loadRecaptchaSiteKey();
    }
    if (!this.enableCaptcha) {
      this.enableSendOtp = true;
    }
  }

  loadRecaptchaSiteKey() {
    this.siteKey = this.configService.getConfigByKey(
      "mosip.preregistration.captcha.site.key"
    );
  }

  loadLanguagesWithConfig() {
    this.primaryLangFromConfig = this.configService.getConfigByKey(
      appConstants.CONFIG_KEYS.mosip_primary_language
    );
    this.secondaryLangFromConfig = this.configService.getConfigByKey(
      appConstants.CONFIG_KEYS.mosip_secondary_language
    );
    if (
      !this.primaryLangFromConfig ||
      !this.secondaryLangFromConfig ||
      this.primaryLangFromConfig === "" ||
      this.secondaryLangFromConfig === ""
    ) {
      const message = {
        case: "MESSAGE",
        message: this.LANGUAGE_ERROR_TEXT,
      };
      this.dialog.open(DialougComponent, {
        width: "350px",
        data: message,
        disableClose: true,
      });
    }

    this.primaryLang = this.primaryLangFromConfig;
    this.secondaryLang = this.secondaryLangFromConfig;

    this.setLanguageDirection(
      this.primaryLangFromConfig,
      this.secondaryLangFromConfig
    );
    localStorage.setItem("langCode", this.primaryLangFromConfig);
    localStorage.setItem("secondaryLangCode", this.secondaryLangFromConfig);
    this.translate.use(this.primaryLang);
    this.selectedLanguage =
      appConstants.languageMapping[this.primaryLang].langName;
    if (
      appConstants.languageMapping[this.primaryLangFromConfig] &&
      appConstants.languageMapping[this.secondaryLangFromConfig]
    ) {
      this.languages.push(
        appConstants.languageMapping[this.primaryLangFromConfig].langName
      );
      if (this.primaryLang !== this.secondaryLang) {
        this.languages.push(
          appConstants.languageMapping[this.secondaryLangFromConfig].langName
        );
      }
    }
    this.translate.addLangs([
      this.primaryLangFromConfig,
      this.secondaryLangFromConfig,
    ]);
    this.showSpinner = false;
    this.loadValidationMessages();
  }

  setLanguageDirection(primaryLang: string, secondaryLang: string) {
    const ltrLangs = this.configService
      .getConfigByKey(appConstants.CONFIG_KEYS.mosip_left_to_right_orientation)
      .split(",");
    if (ltrLangs.includes(primaryLang)) {
      this.dir = "ltr";
    } else {
      this.dir = "rtl";
    }
    if (ltrLangs.includes(secondaryLang)) {
      this.secondaryDir = "ltr";
    } else {
      this.secondaryDir = "rtl";
    }
    localStorage.setItem("dir", this.dir);
    localStorage.setItem("secondaryDir", this.secondaryDir);
    this.textDir = localStorage.getItem("dir");
  }

  setTimer() {
    const time = Number(
      this.configService.getConfigByKey(
        appConstants.CONFIG_KEYS.mosip_kernel_otp_expiry_time
      )
    );
    if (!isNaN(time)) {
      const minutes = time / 60;
      const seconds = time % 60;
      if (minutes < 10) {
        this.minutes = "0" + minutes;
      } else {
        this.minutes = String(minutes);
      }
      if (seconds < 10) {
        this.seconds = "0" + seconds;
      } else {
        this.seconds = String(seconds);
      }
    } else {
      this.minutes = "02";
      this.seconds = "00";
    }
  }

  changeLanguage(): void {
    if (
      this.selectedLanguage !==
      appConstants.languageMapping[this.primaryLangFromConfig].langName
    ) {
      this.secondaryLang = this.configService.getConfigByKey(
        appConstants.CONFIG_KEYS.mosip_primary_language
      );
      this.primaryLang = this.configService.getConfigByKey(
        appConstants.CONFIG_KEYS.mosip_secondary_language
      );
      this.setLanguageDirection(this.primaryLang, this.secondaryLang);
      this.authService.primaryLang = this.primaryLang;
      localStorage.setItem("langCode", this.primaryLang);
      localStorage.setItem("secondaryLangCode", this.secondaryLang);
      this.router.navigate([localStorage.getItem("langCode")]);
    } else {
      this.primaryLang = this.configService.getConfigByKey(
        appConstants.CONFIG_KEYS.mosip_primary_language
      );
      this.secondaryLang = this.configService.getConfigByKey(
        appConstants.CONFIG_KEYS.mosip_secondary_language
      );
      this.authService.primaryLang = this.primaryLang;
      this.setLanguageDirection(this.primaryLang, this.secondaryLang);
      localStorage.setItem("langCode", this.primaryLang);
      localStorage.setItem("secondaryLangCode", this.secondaryLang);
      this.router.navigate([localStorage.getItem("langCode")]);
    }
    this.translate.use(localStorage.getItem("langCode"));
    this.loadValidationMessages();
  }

  showVerifyBtn() {
    if (
      this.inputOTP.length ===
      Number(
        this.configService.getConfigByKey(
          appConstants.CONFIG_KEYS.mosip_kernel_otp_default_length
        )
      )
    ) {
      this.showVerify = true;
      this.showResend = false;
    } else {
      this.showResend = true;
      this.showVerify = false;
    }
  }

  submit(): void {
    this.loginIdValidator();
    this.resetCaptcha = false;
    if (
      (this.showSendOTP || this.showResend) &&
      this.errorMessage == "" &&
      this.enableSendOtp
    ) {
      this.loadingMessage = this.validationMessages["loading"];
      this.dataService
        .sendOtpWithCaptcha(
          this.inputContactDetails,
          localStorage.getItem("langCode"),
          this.captchaToken
        )
        .subscribe(
          (response) => {
            this.loadingMessage = "";
            if (!response["errors"]) {
              let otpSentTime = response["responsetime"];
              localStorage.setItem("otp_sent_time", String(otpSentTime));
              localStorage.setItem(
                "user_email_or_phone",
                this.inputContactDetails
              );
              this.errorMessage = undefined;
      this.inputOTP = "";
              //this.showResend = false;
      this.showOTP = true;
      this.showSendOTP = false;
      this.showContactDetails = false;
              localStorage.setItem("show_captcha", JSON.stringify(false));
      this.showCaptcha = false;
              // initial set up for timer
              console.log("setting timer");
              this.setTimer();
              if (document.getElementById("timer")) {
                document.getElementById("timer").style.visibility = "visible";
          }
              if (document.getElementById("secondsSpan")) {
        document.getElementById("secondsSpan").innerText = this.seconds;
              }
              if (document.getElementById("minutesSpan")) {
        document.getElementById("minutesSpan").innerText = this.minutes;
              }
              this.timer = setInterval(this.timerFn, 1000);
      } else {
              if (this.enableCaptcha) {
                //this.inputContactDetails = "";
                this.resetCaptcha = true;
                this.captchaToken = null;
                this.enableSendOtp = false;
                console.log("Resetting captcha:" + this.resetCaptcha);
      }
              this.loadingMessage = "";
              const otpFailedToSendMsg = this.validationMessages["serverUnavailable"];
              this.showOTPErrorMessage(response, otpFailedToSendMsg);
            }
        },
        (error) => {
            clearInterval(this.timer);
          if (this.enableCaptcha) {
            this.resetCaptcha = true;
            this.captchaToken = null;
            this.enableSendOtp = false;
            console.log("Resetting captcha:" + this.resetCaptcha);
          }
            this.loadingMessage = "";
            const otpFailedToSendMsg = this.validationMessages["serverUnavailable"];
            this.showOTPErrorMessage(error, otpFailedToSendMsg);
        }
      );
     

      // dynamic update of button text for Resend and Verify
    } else if (this.showVerify && this.errorMessage === "") {
      this.disableVerify = true;
      this.dataService
        .verifyOtp(this.inputContactDetails, this.inputOTP)
        .subscribe(
          (response) => {
            if (!response["errors"]) {
              clearInterval(this.timer);
              localStorage.setItem("loggedIn", "true");
              this.authService.setToken();
              this.regService.setLoginId(this.inputContactDetails);
              localStorage.setItem("loginId", this.inputContactDetails);
              this.disableVerify = false;
              this.router.navigate([this.primaryLang, "dashboard"]);
            } else {
              this.disableVerify = false;
              this.showOtpMessage();
            }
          },
          (error) => {
            this.disableVerify = false;
            this.showErrorMessage();
          }
        );
    }
  }

  /**
   * @description This is a dialoug box whenever an error comes from the server, it will appear.
   *
   * @private
   * @memberof DemographicComponent
   */
  private showOTPErrorMessage(response: any, customMsg?: string) {
    const titleOnError = "ERROR";
    let message = "";
    message = response["errors"][0].message;
    const body = {
      case: "ERROR",
      title: titleOnError,
      message: message,
      yesButtonText: "OK",
    };
    this.dialog.open(DialougComponent, {
      width: "400px",
      data: body,
    });
  }

  getCaptchaToken(event: Event) {
    if (event !== undefined && event != null) {
      console.log("Captcha event " + event);
      this.captchaToken = event;
      this.enableSendOtp = true;
    } else {
      console.log("Captcha has expired" + event);
      this.enableSendOtp = false;
    }
  }

  showOtpMessage() {
    this.inputOTP = "";
    let factory = new LanguageFactory(localStorage.getItem("langCode"));
    let response = factory.getCurrentlanguage();
    let otpmessage = response["message"]["login"]["msg3"];
    const message = {
      case: "MESSAGE",
      message: otpmessage,
    };
    this.dialog.open(DialougComponent, {
      width: "350px",
      data: message,
    });
  }

  showErrorMessage() {
    let factory = new LanguageFactory(localStorage.getItem("langCode"));
    let response = factory.getCurrentlanguage();
    let errormessage = response["error"]["error"];
    const message = {
      case: "MESSAGE",
      message: errormessage,
    };
    this.dialog.open(DialougComponent, {
      width: "350px",
      data: message,
    });
  }
}
