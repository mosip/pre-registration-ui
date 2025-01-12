import {Component, HostListener, OnDestroy, OnInit} from '@angular/core';
import {Event as NavigationEvent, NavigationStart, Router} from '@angular/router';
import {filter} from 'rxjs/operators';

import {AutoLogoutService} from 'src/app/core/services/auto-logout.service';
import {ConfigService} from './core/services/config.service';
import {Subscription} from 'rxjs';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
    title = 'pre-registration';
    message: object;
    subscriptions: Subscription[] = [];

    constructor(private autoLogout: AutoLogoutService, private router: Router, private configService: ConfigService) {
    }

    ngOnInit() {
        this.subscriptions.push(this.autoLogout.currentMessageAutoLogout.subscribe(() => {
            // This is intentional
        }));
        this.autoLogout.changeMessage({timerFired: false});
        this.routerType();
    }

    routerType() {
        this.subscriptions.push(
            this.router.events
                .pipe(filter((event: NavigationEvent) => event instanceof NavigationStart))
                .subscribe((event: NavigationStart) => {
                    if (event.restoredState) {
                        // This is intentional
                    }
                })
        );
    }

    // preventBack() {
    //   window.history.forward();
    //   window.onunload = function() {
    //     null;
    //     console.log("Hello")
    //   };
    // }

    @HostListener('mouseover')
    @HostListener('document:mousemove', ['$event'])
    @HostListener('keypress')
    @HostListener('click')
    @HostListener('document:keypress', ['$event'])
    onMouseClick() {
        this.autoLogout.setisActive(true);
        this.updateLastActionTimestamp(); // Added as part of MOSIP-37079
    }


    @HostListener('window:load', ['$event'])
    @HostListener('document:visibilitychange', ['$event'])
    @HostListener('window:beforeunload', ['$event'])
    onVisibilityChange(event?: Event) {
        console.warn(`Event detected: '${event.type}'.`);
        this.onVisibilityChangeCheckSessionHandler(event); // Added as part of MOSIP-37079
    }

    /**
     * @description Detects when the page becomes hidden or visible and validates the session.
     * Implemented as part of MOSIP-37079 to handle session timeout when the user switches tabs.
     *
     * @param event
     * @private
     */
    private onVisibilityChangeCheckSessionHandler(event?: Event) {
        const isHiddenState: boolean = (('beforeunload' === event.type) || ('hidden' === document.visibilityState));
        if (isHiddenState) {
            this.updateHiddenTimestamp();
        } else {
            this.autoLogout.validateHiddenState();
        }
    }

    /**
     * @description Updates the timestamp of the last user action in sessionStorage.
     * Implemented as part of MOSIP-37079 to track user activity for session timeout management.
     */
    private updateLastActionTimestamp() {
        sessionStorage.setItem('lastActionTimestamp', Date.now().toString());
    }

    /**
     * @description Updates the timestamp of hidden page action in sessionStorage.
     * Implemented as part of MOSIP-37079 to track user activity for session timeout management.
     */
    private updateHiddenTimestamp() {
        let lastActionTimestampValue: string = (sessionStorage.getItem('lastActionTimestamp'));
        if (!lastActionTimestampValue) {
            lastActionTimestampValue = Date.now().toString();
        }
        sessionStorage.setItem('hiddenTimestamp', lastActionTimestampValue);
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(subscription => subscription.unsubscribe());
    }
}
