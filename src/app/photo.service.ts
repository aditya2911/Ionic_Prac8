import { Injectable } from '@angular/core';
import { Component } from '@angular/core';
import { Directory, Filesystem, FilesystemDirectory } from '@capacitor/filesystem'
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Platform } from '@ionic/angular';
import { Capacitor } from '@capacitor/core/';
import { Preferences } from '@capacitor/preferences';
@Injectable({
  providedIn: 'root'
})
export class PhotoService {

  public photos:UserPhoto[]= [];
  private PHOTO_STORAGE:string = 'photos';
  constructor(private platform:Platform) {}
  
  public async loadSaved() {
    // Retrieve cached photo array data
    try{
      const photoList = await Preferences.get({ key: this.PHOTO_STORAGE });
  
      const photoListValue = photoList.value;
      if (photoListValue !== null) {
        this.photos = JSON.parse(photoListValue);
      } else {
        this.photos = [];
      }
    }
    catch(error){
      console.error('Error loading photos:', error);
    }
   
    // If running on the web...
    if (!this.platform.is('hybrid')) {
    // Display the photo by reading into base64 format
    for (let photo of this.photos) {
    // Read each saved photo's data from the Filesystem
    const readFile = await Filesystem.readFile({
    path: photo.filepath,
    directory: Directory.Data,
    });
    // Web platform only: Load the photo as base64 data
    photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
    }
    }
    }
  
    async addNewToGallery() {
      try {
        // Take a photo
        const capturedPhoto = await Camera.getPhoto({
          resultType: CameraResultType.Uri,
          source: CameraSource.Camera,
          quality: 100
        });
  
        const savedImageFile = await this.savePicture(capturedPhoto);
        this.photos.unshift(savedImageFile);
  
        await Preferences.set({
          key: this.PHOTO_STORAGE,
          value: JSON.stringify(this.photos),
        });
      } catch (error) {
        console.error('Error adding photo to gallery:', error);
      }
    }
  
  
    private async readAsBase64(cameraPhoto: any) {
      // "hybrid" will detect Cordova or Capacitor
      if (this.platform.is('hybrid')) {
        // Read the file into base64 format
        const file = await Filesystem.readFile({
          path: cameraPhoto.path,
        });
        return file.data;
      } else {
        // Fetch the photo, read as a blob, then convert to base64 format
        const response = await fetch(cameraPhoto.webPath!);
        const blob = await response.blob();
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
          reader.onerror = reject;
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }
    }
    
  
          // Delete picture by removing it from reference data and the filesystem
  public async deletePicture(photo: UserPhoto, position: number) {
    // Remove this photo from the Photos reference data array
    this.photos.splice(position, 1);
    // Update photos array cache by overwriting the existing photo array
    Preferences.set({
    key: this.PHOTO_STORAGE,
    value: JSON.stringify(this.photos),
    })
    // delete photo file from filesystem
  const filename = photo.filepath.substr(photo.filepath.lastIndexOf('/') + 1);
  await Filesystem.deleteFile({
  path: filename,
  directory: Directory.Data,
  });
  }
  
  
  
  private async savePicture(cameraPhoto: any): Promise<UserPhoto> {
    let base64Data: string;
  
    if (this.platform.is('hybrid')) {
      const file = await Filesystem.readFile({
        path: cameraPhoto.path,
      });
      base64Data = file.data;
    } else {
      const response = await fetch(cameraPhoto.webPath);
      const blob = await response.blob();
      base64Data = await this.convertBlobToBase64(blob) as string;
    }
  
    const fileName = new Date().getTime() + '.jpeg';
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: FilesystemDirectory.Data,
    });
  
    if (this.platform.is('hybrid')) {
      // Display the new image by rewriting the 'file://' path to HTTP
      return {
        filepath: savedFile.uri,
        webviewPath: Capacitor.convertFileSrc(savedFile.uri),
      };
    } else {
      // Web platform
      return {
        filepath: fileName,
        webviewPath: cameraPhoto.webPath,
      };
    }
  }
  
    addPhotoToGallery() {
      this.addNewToGallery();
    }
    convertBlobToBase64 = (blob: Blob) =>
  new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = reject;
  reader.onload = () => {
  resolve(reader.result);
  };
  reader.readAsDataURL(blob);
  });
  
  
  
  }
  export interface UserPhoto {
    filepath: string;
    webviewPath: string;
    }
  