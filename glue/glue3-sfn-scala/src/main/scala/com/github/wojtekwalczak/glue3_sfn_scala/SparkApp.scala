package com.github.wojtekwalczak.glue3_sfn_scala

import org.apache.spark.sql.SparkSession

object SparkApp extends App {
  val spark = SparkSession.builder()
    .appName("Glue3SfnScala")
    .getOrCreate()

  println("APP Name :" + spark.sparkContext.appName)
  println("Deploy Mode :" + spark.sparkContext.deployMode)
  println("Master :" + spark.sparkContext.master)

  import spark.implicits._

  val df = Seq(
    (1, "Afghanistan"),
    (2, "Albania"),
    (3, "Algeria")).toDF("number", "word")

  df.show()
}
