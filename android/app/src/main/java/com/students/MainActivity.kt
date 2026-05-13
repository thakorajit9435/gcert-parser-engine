package com.students

import android.os.Bundle
import com.facebook.react.ReactActivity
import org.devio.rn.splashscreen.SplashScreen  // 👈 add this import

class MainActivity : ReactActivity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    SplashScreen.show(this)  // 👈 add this line
    super.onCreate(savedInstanceState)
  }

  override fun getMainComponentName(): String = "Students"
}