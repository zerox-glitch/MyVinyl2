# kotlinx.serialization
-keepattributes *Annotation*, InnerClasses
-keepclassmembers class com.vynyl.record.** { *** Companion; }
-keepclasseswithmembers class com.vynyl.record.** { kotlinx.serialization.KSerializer serializer(...); }
-keep,includedescriptorclasses class com.vynyl.record.**$$serializer { *; }
