import {Injectable} from '@angular/core';
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Observable} from 'rxjs';


@Injectable()
export class CacheInterceptorService implements HttpInterceptor {

    /**
     * @description Intercepts HTTP requests to disable caching by adding appropriate headers.
     * Implemented as part of MOSIP-37079 to ensure session data is not restored from cache.
     * @param req The outgoing HTTP request.
     * @param next The HTTP request handler.
     * @returns The modified HTTP request.
     */
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const modifiedReq = req.clone({
            setHeaders: {
                'Cache-Control': 'no-store, no-cache, must-revalidate',
                Pragma: 'no-cache',
                Expires: '0',
            },
        });
        return next.handle(modifiedReq);
    }

}
