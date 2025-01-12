import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HTTP_INTERCEPTORS} from '@angular/common/http';

import {AboutUsComponent} from './about-us/about-us.component';
import {FaqComponent} from './faq/faq.component';
import {HeaderComponent} from './header/header.component';
import {FooterComponent} from './footer/footer.component';
import {ContactComponent} from './contact/contact.component';
import {AppRoutingModule} from '../app-routing.module';
import {SharedModule} from '../shared/shared.module';
import {AuthInterceptorService} from '../shared/auth-interceptor.service';
import {CacheInterceptorService} from "../shared/cache-interceptor.service";

@NgModule({
    imports: [CommonModule, AppRoutingModule, SharedModule],
    declarations: [HeaderComponent, FooterComponent, AboutUsComponent, FaqComponent, ContactComponent],
    exports: [HeaderComponent, FooterComponent, SharedModule],
    providers: [
        {provide: HTTP_INTERCEPTORS, useClass: AuthInterceptorService, multi: true},
        // CacheInterceptorService Added as part of MOSIP-37079 to ensure session data is not restored from cache.
        {provide: HTTP_INTERCEPTORS, useClass: CacheInterceptorService, multi: true},
    ],
})
export class CoreModule {
}

