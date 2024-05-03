import { Component, inject, Input } from '@angular/core';
import { AuthService, User } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { jwtDecode } from 'jwt-decode';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { environment } from '../../environments/environment.development';
import { ImageModule } from 'primeng/image';
import { NavigationComponent } from '../navigation/navigation.component';
import { MeetingComponent } from '../meeting/meeting.component';
import { CustomToasterService, MessageType, PositionType } from '../services/ui/custom-toaster.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    ImageModule,
    NavigationComponent,
    MeetingComponent,
    RouterOutlet,
  ],
  template: `
    <app-navigation [user]="user" [imageUrl]="imageUrl"></app-navigation>
    <section>
      <router-outlet></router-outlet>
    </section>
    <!-- <div>
      <ul>
        <li *ngFor="let key of getObjectKeys(user)">
          <strong>{{ key }}:</strong> {{ user[key] }}
        </li>
      </ul>
    </div> -->
  `,
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  authService = inject(AuthService);
  userService = inject(UserService);
  user: User;
  imageUrl: string;

  getObjectKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  constructor(private router: Router, private toastr: CustomToasterService) {
    this.toastr.sendNotification("User login is successful", "Welcome", MessageType.Success, PositionType.TopRight);
  }

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    console.log(token);
    if (!token) {
      this.router.navigate(['/']);
      return;
    }    

    const decodedToken = jwtDecode(token);
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    if (decodedToken.exp < currentTime) {
      console.log('Token is expired');
      localStorage.removeItem('token');
      this.router.navigate(['/']);
      return;
    }

    const userId = this.getUserIdFromToken(token);
    if (!userId) {
      this.router.navigate(['/']);
      return;
    }

    this.authService.setAuthToken(token);
    this.userService.userId = userId;
    if (this.authService.getAuthToken()) this.fetchUserById(userId);
  }

  private getUserIdFromToken(token: string): string | null {
    try {
      const decodedToken = jwtDecode(token);
      return decodedToken.sub;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  async fetchUserById(id: string) {
    try {
      const user = await this.userService.getUserById(id);
      this.user = user;
      this.imageUrl = `${environment.apiRoute}/Uploads/Files/${user.profilePictureUrl}`;
    } catch (error) {
      console.log(error);
    }
  }
}
