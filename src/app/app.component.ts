import { Component, OnInit, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly appInstanceId = 'appInstance';
  constructor(private translate: TranslateService) {
    translate.setDefaultLang('en'); // Set default language to English
    translate.use('en'); // Use English translations
  }
  ngOnInit() {
    if (localStorage.getItem(this.appInstanceId)) {
      
      window.close(); // Optionally close the tab
    } else {
      localStorage.setItem(this.appInstanceId, 'true');
      window.addEventListener('beforeunload', this.clearLocalStorage);
      window.addEventListener('storage', this.onStorageEvent);
    }
  }

  ngOnDestroy() {
    this.clearLocalStorage();
  }

  private clearLocalStorage = () => {
    localStorage.removeItem(this.appInstanceId);
    window.removeEventListener('beforeunload', this.clearLocalStorage);
    window.removeEventListener('storage', this.onStorageEvent);
  };

  private onStorageEvent = (event: StorageEvent) => {
    if (event.key === this.appInstanceId && !event.newValue) {
      window.removeEventListener('storage', this.onStorageEvent);
      window.location.reload(); // Refresh the tab if the other instance is closed
    }
  };
}
