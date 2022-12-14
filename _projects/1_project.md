---
layout: page
title: Attrition KNN/NB Models
description: Model generation for KNN/NB
img: assets/img/prediction.png
importance: 1
category: work
---

Every project has a beautiful feature showcase page.
It's easy to include images in a flexible 3-column grid format.
Make your photos 1/3, 2/3, or full width.

To give your project a background in the portfolio page, just add the img tag to the front matter like so:

    ---
    layout: page
    title: project
    description: a project with a background image
    img: /assets/img/12.jpg
    ---

(I've hidden the secret token, I got an angry email from Amazon)

All the code required to perform a statistical analysis on the Attrition Dataset:

```{r include=TRUE, results = "hide"}
library(aws.s3)
library(readxl)
library(ggplot2)
library(caret)
library(RCurl)
library(class)
library(tidyverse)
library(olsrr)
library(corrplot)
library(mlbench)
library(klaR)
```

Pulling Data:

```{r echo = T, results = "hide", warning=FALSE}
#bucket_list()
#get_bucket("smuddsproject2")

#fullset = s3read_using(FUN = read.csv, bucket = "smuddsproject2", object = "CaseStudy2-data.csv")
#NoSal <- s3read_using(FUN = read_xlsx, object = "CaseStudy2CompSet No Salary.xlsx", bucket = "smuddsproject2")
#CompSetAttr <- s3read_using(FUN = read.csv, object = "CaseStudy2CompSet No Attrition.csv", bucket = "smuddsproject2")

fullset = read.csv('./Data/housing_fullset.csv')
NoSal = read.csv("./Data/housing_nosal.csv")
CompSetAttr = read.csv("./Data/housing_noattr.csv")
numericset <- fullset %>% select_if(is_numeric)

selected_features = numericset %>% dplyr::select("Age", "MonthlyIncome", "DistanceFromHome", "JobSatisfaction", "WorkLifeBalance", "YearsAtCompany")
selected_features$DistanceFromHome = as.factor(selected_features$DistanceFromHome)
selected_features$WorkLifeBalance = as.factor(selected_features$WorkLifeBalance)
```

Generating the Linear Model for Salary Data:

```{r echo = T, results = "hide", warning=FALSE}
character_parameters = fullset %>% select_if(is.character) %>% names()

fullset_conversion = fullset
fullset_conversion[character_parameters] = lapply(fullset_conversion[character_parameters], factor)
fullset_conversion = subset(fullset_conversion, select = -c(Over18, EmployeeCount, StandardHours, ID, EmployeeNumber) )#rm no useful data
fullset_conversion$MonthlyRate = log(fullset_conversion$MonthlyRate)

characterset = fullset_conversion %>% select_if(is.factor) %>% names()
fullset_conversion[characterset] = lapply(fullset_conversion[characterset], as.numeric)

#corrplot(cor(fullset_conversion), tl.cex = 0.5)
#fullset_conversion = subset(fullset_conversion, select = -c(EmployeeCount, StandardHours, ID, EmployeeNumber))
#corrplot(cor(fullset_conversion), tl.cex = 0.5)
#remove aliased coeef. (joblevel, employeecount, standardhours, performancerating, totalworkingyears, yearsatcurrentrole
conversion_sig = findCorrelation(x = cor(fullset_conversion), cutoff = 0.4)

parameter_fit = lm(Attrition~., data = fullset_conversion)

stepwise_selection = ols_step_both_p(parameter_fit, pent = 0.4, prem = 0.1, details = FALSE) 
summary(stepwise_selection$model)

#control = trainControl(method = "repeatedcv", number = 10, repeats = 10)
#model <- train(MonthlyRate~. , data = fullset_conversion, method = "lvq", preProcess= "scale", trControl = control)

#importance = varImp(model, scale = FALSE)
#plot(importance)


bestmodel <- lm((MonthlyIncome) ~. , data = fullset_conversion)
#bestselection = ols_step_best_subset(bestmodel)
stepselection = ols_step_both_p(bestmodel, pent = 0.2, prem = 0.1, details = FALSE)

#prediction for Salary (LR):
t.nosal = NoSal
t.nosal[characterset] = lapply(t.nosal[characterset], as.numeric)

p.nosal = predict(stepselection$model,t.nosal)


p_df = data.frame(NoSal$ID, p.nosal)
colnames(p_df) = c("ID", "MonthlyIncome")

#write.csv(p_df, "./Data/Case2PredictionsSharma_Salary.csv", row.names = FALSE)

summary(stepselection$model)
#plot(stepselection$model)
```

Performing the upsampling and knn-training of that model:

```{r echo = T, results = "hide"}
## Downsample to resolve class imbalance: 

#features_down = downSample(numericset, fullset$Attrition, yname = "Attrition") #downsample
#train_down = subset(features_down, select = -c(Attrition))
fullset$Attrition = as.factor(fullset$Attrition)
features_up = upSample(selected_features, fullset$Attrition, yname = "Attrition") #upsample
train_up = subset(features_up, select = -c(Attrition))

## KNN Model Generation w/ DownSampling

#garbagetest---------------------------------

fullset_noNA = fullset_conversion %>% drop_na()
fullset_noNA$Attrition = as.numeric(fullset_noNA$Attrition)
rash_features = upSample(fullset_noNA, fullset$Attrition, yname = "Attrition")
rash_train = subset(rash_features, select = -c(Attrition))

#rashknn = knn.cv(rash_train, rash_features$Attrition, k=3, prob = TRUE) # didn't pan out

#train = subset(fullset, select = -c(Attrition))


knn_model = knn.cv(train_up, features_up$Attrition, k = 1, prob = TRUE)
confusionMatrix(table(knn_model, features_up$Attrition), positive = "Yes")

maxKvalue = 100
accuracyVector = c(maxKvalue)

for(i in 1:maxKvalue){
  classifications = knn.cv(train_up, features_up$Attrition, k = i, prob = TRUE)
  accuracyVector[i] = confusionMatrix(table(classifications, features_up$Attrition),
                                            positive = "Yes")$overall[1]
}

#plot(seq(1, maxKvalue, 1), accuracyVector, type = "l",
    # xlab = "K value", ylab = "accuracy", main = "accuracy for k values")

# Comp-Set KNN Model

CompSetAttrFeatures = CompSetAttr %>% dplyr::select("Age", "MonthlyRate",
                                             "DistanceFromHome", "JobSatisfaction",
                                             "WorkLifeBalance", "YearsAtCompany")

attrcompset = knn(train_up, CompSetAttrFeatures, features_up$Attrition, k = 3)

pa_df = data.frame(CompSetAttr$ID, attrcompset)
colnames(pa_df) = c("ID", "Attrition")



#write.csv(pa_df, "./Data/Case2PredictionsKNNSharma_Attrition.csv", row.names = FALSE)
```

Some depreciated External Cross Validation Code: Required for the rest of the document though :(

```{r echo = T, results = "hide", warning=FALSE, }
## KNN External CrossValidation: 

choice = c("MonthlyIncome", "TotalWorkingYears", "StockOptionLevel", "YearsWithCurrManager", "Age")

sample_size = 100
test_index = sample(seq(1:dim(fullset)[1]), sample_size)

AttrTrain = fullset[-test_index,]
AttrTrainLabels = AttrTrain %>% dplyr::select("Attrition")
AttrTrain = AttrTrain %>% dplyr::select(all_of(choice))
AttrTest = fullset[test_index,]
AttrTestLabels = AttrTest %>% dplyr::select("Attrition")
AttrTest = AttrTest %>% dplyr::select(all_of(choice))


AttrTrainNum = AttrTrain %>% dplyr::select(where(is_numeric)) 
AttrTrainNum = AttrTrainNum %>% dplyr::select(all_of(choice))

ext_features_up = upSample(AttrTrainNum, as.factor(AttrTrainLabels$Attrition), yname = "Attrition")
ext_train_up = subset(ext_features_up, select = -c(Attrition))

ext_knn = knn(ext_train_up, AttrTest, ext_features_up$Attrition, k = 2)
confusionMatrix(table(ext_knn, as.factor(AttrTestLabels$Attrition)), positive = "Yes")
```


Running a NaiveBayesModel and checking:

```{r echo = T, results = "hide"}
## NaiveBayes Model -- Attrition 
library(klaR)


badmeme = subset(fullset, select = -c(ID,EmployeeCount, StandardHours,
                                      BusinessTravel, Department, EducationField,
                                       Gender, JobRole, MaritalStatus, Over18, OverTime))

control = trainControl(method = "repeatedcv", number = 10, repeats = 10)

#nb_model <- train(Attrition ~ ., data = features_up, method = "nb", trControl = control)

#nb_prediction = predict(nb_model, ext_train_up)

#confusionMatrix(nb_prediction, ext_features_up$Attrition)

```

Feature Importance Graphs:

```{r echo = T, results = "hide"}
## Feature Importance: 
library(mlbench)

corr_dataset = subset(fullset, select = -c(Attrition, EmployeeCount, StandardHours))
corr_dataset = corr_dataset %>% select_if(is.numeric)


sigdata = findCorrelation(x = cor(corr_dataset), cutoff = 0.3) #reduce multicollinearity

head(corr_dataset[sigdata])

summary(fullset)
badmeme = subset(fullset, select = -c(EmployeeCount, StandardHours, BusinessTravel, Department, EducationField, Gender, JobRole, MaritalStatus, Over18, OverTime))

control = trainControl(method = "repeatedcv", number = 10, repeats = 10)
#model <- train(Attrition ~. , data = fullset_conversion, method = "lvq", preProcess= "scale", trControl = control)

#model1 <- train(MonthlyIncome ~., data = badmeme, method = "lvq", preProcess= "scale", trControl = control)

#importance = varImp(model, scale = FALSE)
#plot(importance)
```
{% endraw %}
