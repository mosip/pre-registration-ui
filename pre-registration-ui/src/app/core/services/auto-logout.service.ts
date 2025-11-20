import {Injectable} from '@angular/core';
import {UserIdleConfig, UserIdleService} from 'angular-user-idle';
import {AuthService} from 'src/app/auth/auth.service';
import {MatDialog} from '@angular/material';
import {DialougComponent} from 'src/app/shared/dialoug/dialoug.component';
import {BehaviorSubject} from 'rxjs';
import {ConfigService} from 'src/app/core/services/config.service';
import * as appConstants from 'src/app/app.constants';
import {DataStorageService} from './data-storage.service';

/**
 * @description This class is responsible for auto logging out user when he is inactive for a
 *  specified period of time.
 * @author Deepak Choudhary
 * @export
 * @class AutoLogoutService
 */

@Injectable({
    providedIn: 'root'
})
export class AutoLogoutService {
    private messageAutoLogout = new BehaviorSubject({});
    currentMessageAutoLogout = this.messageAutoLogout.asObservable();
    isActive = false;

    timer = new UserIdleConfig();
    languagelabels: any;
    langCode = localStorage.getItem('langCode');

    idle: number;
    timeout: number;
    ping: number;
    dialogref;
    dialogreflogout;

    constructor(
        private userIdle: UserIdleService,
        private authService: AuthService,
        private dialog: MatDialog,
        private configservice: ConfigService,
        private dataStorageService: DataStorageService
    ) {
    }

    /**
     * @description This method gets value of idle,timeout and ping parameter from config file.
     *
     * @returns void
     * @memberof AutoLogoutService
     */
    getValues(langCode) {
        this.idle = Number(this.configservice.getConfigByKey(appConstants.CONFIG_KEYS.mosip_preregistration_auto_logout_idle))
        this.timeout = Number(this.configservice.getConfigByKey(appConstants.CONFIG_KEYS.mosip_preregistration_auto_logout_timeout))
        this.ping = Number(this.configservice.getConfigByKey(appConstants.CONFIG_KEYS.mosip_preregistration_auto_logout_ping))
        this.dataStorageService
            .getI18NLanguageFiles(langCode)
            .subscribe((response) => {
                this.languagelabels = response['autologout'];
            });

    }

    setisActive(value: boolean) {
        this.isActive = value;
    }

    getisActive() {
        return this.isActive;
    }

    changeMessage(message: object) {
        this.messageAutoLogout.next(message);
    }

    /**
     * @description This method sets value of idle,timeout and ping parameter from config file.
     *
     * @returns void
     * @memberof AutoLogoutService
     */
    setValues() {
        this.timer.idle = this.idle;
        this.timer.ping = this.ping;
        this.timer.timeout = this.timeout;
        this.userIdle.setConfigValues(this.timer);
    }

    /**
     * @description This method is fired when dashboard gets loaded and starts the timer to watch for
     * user idle. onTimerStart() is fired when user idle has been detected for specified time.
     * After that onTimeout() is fired.
     *
     * @returns void
     * @memberof AutoLogoutService
     */
    public keepWatching() {
        this.userIdle.startWatching();
        this.changeMessage({timerFired: true});

        this.userIdle.onTimerStart().subscribe(
            res => {
                if (res == 1) {
                    this.setisActive(false);
                    this.openPopUp();
                } else {
                    if (this.isActive) {
                        if (this.dialogref) this.dialogref.close();
                    }
                }
            },
            () => {
                // This is intentional
            },
            () => {
                // This is intentional
            }
        );

        this.userIdle.onTimeout().subscribe(() => {
            if (!this.isActive) {
                this.onLogOut();
            } else {
                this.userIdle.resetTimer();
            }
        });
    }

    public continueWatching() {
        this.userIdle.startWatching();
    }


    /**
     * @description Starts periodic validation of user activity.
     * Ensures that session remains valid during application usage.
     */
    public startRegularValidation(): void {
        if (this.timeout) {
            const that = this;
            // Validation interval set to half the timeout duration :
            const intervalDelay = (this.timeout * 1000) / 2;
            // Set Interval for regular checking :
            setInterval(() => {
                that.validateUserActivity(); // Validate user activity periodically
            }, intervalDelay); // Validation interval set to half the timeout duration
        }
    }

    /**
     * @description Validates user inactivity based on the last action timestamp.
     * If the time since the last user action exceeds the timeout, the user is logged out.
     * Implemented as part of MOSIP-37079 to handle session timeout due to user inactivity.
     * @returns void
     */
    public validateUserActivity(): void {
        const lastActionTimestampValue = (sessionStorage.getItem('lastActionTimestamp') || '0');
        const lastActionTimestamp = parseInt(lastActionTimestampValue);
        this.validateActionActivityBasedOnConfiguredIdleTimeout(lastActionTimestamp);
    }

    /**
     * @description Validates inactivity based on the hidden state timestamp or last action timestamp.
     * If the time since the page was hidden exceeds the timeout, the user is logged out.
     * Implemented as part of MOSIP-37079 to handle session timeout due to hidden page state.
     * @returns void
     */
    public validateHiddenState(): void {
        let lastActivityTimestampValue = (sessionStorage.getItem('hiddenTimestamp'));
        if (!lastActivityTimestampValue) {
            lastActivityTimestampValue = (sessionStorage.getItem('lastActionTimestamp') || '0');
        }
        const lastActivityTimestamp = parseInt(lastActivityTimestampValue);
        this.validateActionActivityBasedOnConfiguredTimeout(lastActivityTimestamp);
    }


    /**
     * @description Validates user inactivity based on configured idle timeout and action timestamp.
     * If the time since the user action exceeds the timeout, the user is logged out.
     * Implemented as part of MOSIP-37079 to handle session timeout due to user inactivity.
     *
     * @param actionTimestamp
     * @private
     */
    private validateActionActivityBasedOnConfiguredIdleTimeout(actionTimestamp: number): void {
        if (this.authService.isAuthenticated() && actionTimestamp) {
            this.validateActionActivityTimeout(this.idle, actionTimestamp);
        }
    }

    /**
     * @description Validates user inactivity based on configuration timeout and action timestamp.
     * If the time since the user action exceeds the timeout, the user is logged out.
     * Implemented as part of MOSIP-37079 to handle session timeout due to user inactivity.
     *
     * @param actionTimestamp
     * @private
     */
    private validateActionActivityBasedOnConfiguredTimeout(actionTimestamp: number): void {
        if (this.authService.isAuthenticated() && actionTimestamp) {
            this.validateActionActivityTimeout(this.timeout, actionTimestamp);
        }
    }

    /**
     * @description Validates user inactivity based on given timeout and action timestamp.
     * If the time since the user action exceeds the timeout, the user is logged out.
     * Implemented as part of MOSIP-37079 to handle session timeout due to user inactivity.
     *
     * @param timeout
     * @param actionTimestamp
     * @private
     */
    private validateActionActivityTimeout(timeout: number, actionTimestamp: number): void {
        if (this.authService.isAuthenticated() && actionTimestamp) {
            const currentTime = Date.now();
            const timeoutDelay = (timeout * 1000);
            const inactivityDelay = (currentTime - actionTimestamp);
            const isSessionTimeout = (inactivityDelay > timeoutDelay);
            if (isSessionTimeout) {
                console.warn('Session timed out due to user inactivity.');
                this.logoutAndClearSessionData(); // Automatically logout the user
            }
        }
    }


    /**
     * @description This methoed is used to logged out the user.
     *
     * @returns void
     * @memberof AutoLogoutService
     */
    onLogOut() {
        this.dialogref.close();
        this.dialog.closeAll();
        this.userIdle.stopWatching();
        this.popUpPostLogOut();
        this.logoutAndClearSessionData();  // updated as part of MOSIP-37079
    }

    /**
     * @description This methoed is used to logged out the user.
     * Implemented as part of MOSIP-37079 to handle session timeout due to user inactivity.
     *
     * @returns void
     * @memberof AutoLogoutService
     */
    logoutAndClearSessionData(): void {
        this.clearSessionData();  // Added as part of MOSIP-37079
        this.authService.onLogout();
    }


    /**
     * @description Clears all session-related data in sessionStorage.
     * This method ensures a clean state by removing all user-related data during logout or timeout.
     * Implemented as part of MOSIP-37079 for secure session management.
     * @returns void
     */
    private clearSessionData(): void {
        sessionStorage.clear();
        console.info('All sessions, storages, and cookies have been cleared successfully.');
    }

    /**
     * @description This methoed opens a pop up when user idle has been detected for given time.id
     * @memberof AutoLogoutService
     */

    openPopUp() {
        const data = {
            case: 'POPUP',
            content: this.languagelabels.preview
        };
        this.dialogref = this.dialog.open(DialougComponent, {
            width: '400px',
            data: data
        });
    }

    popUpPostLogOut() {
        const data = {
            case: 'POSTLOGOUT',
            contentLogout: this.languagelabels.post
        };
        this.dialogreflogout = this.dialog.open(DialougComponent, {
            width: '400px',
            data: data
        });
    }
}
