import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent implements OnInit {
  
    currentIndex: number = 0;

  ngOnInit(): void {
    setInterval(() => {
      this.nextImage();
    }, 3000); // 3 seconds
   }

   images: string[] = [
    'https://img.youtube.com/vi/pxPYaVOMqlY/maxresdefault.jpg',
    'https://i.work.ua/employer_gallery/7/5/6/20756.jpg',
    'https://hovorymo.live/assets/images/articles/cheverdak/dlya-kartinok-na-govorimo-4-1.png',
    'https://itstep.school.ge/wp-content/uploads/2024/01/%E1%83%A1%E1%83%99%E1%83%9D%E1%83%9A%E1%83%98%E1%83%A1-%E1%83%A1%E1%83%A2%E1%83%A0%E1%83%A3%E1%83%A5%E1%83%A2%E1%83%A3%E1%83%A0%E1%83%90-.png'
  ];

  
  nextImage(): void {
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
  }
}
