pipeline {
    agent any

    tools {
        jdk 'jdk17'
    }

    environment {
        SCANNER_HOME = tool 'sonarqube-scanner'
    }

    stages {

        stage('Clean Workspace') {
            steps {
                cleanWs()
            }
        }

        stage('Checkout from Git') {
            steps {
                git branch: 'main', url: 'https://github.com/<>'
            }
        }

        stage('Sonarqube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube-Server') {
                    sh """
                    ${SCANNER_HOME}/bin/sonar-scanner \
                    -Dsonar.projectName=3-Tier \
                    -Dsonar.projectKey=3-Tier
                    """
                }
            }
        }

        stage('TRIVY FS SCAN') {
            steps {
                sh "trivy fs . > trivyfs.txt"
            }
        }

        /* ========== FRONTEND BUILD ========== */
        stage('Docker Frontend Build & Push') {
            steps {
                withDockerRegistry(
                    credentialsId: 'dockerhub',
                    url: 'https://index.docker.io/v1/'
                ) {
                    dir('frontend') {
                        sh """
                        docker build -t frontend:latest .
                        docker push frontend:latest
                        """
                    }
                }
            }
        }

        /* ========== BACKEND BUILD ========== */
        stage('Docker Backend Build & Push') {
            steps {
                withDockerRegistry(
                    credentialsId: 'dockerhub',
                    url: 'https://index.docker.io/v1/'
                ) {
                    dir('backend') {
                        sh """
                        docker build -t thoufeek/backend:latest .
                        docker push thoufeek/backend:latest
                        """
                    }
                }
            }
        }

        stage('TRIVY Image Scan - Backend') {
            steps {
                sh "trivy image thoufeek/backend:latest > trivy-backend.txt"
            }
        }

        stage('TRIVY Image Scan - Frontend') {
            steps {
                sh "trivy image thoufeek/frontend:latest > trivy-frontend.txt"
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                dir('k8s') {
                    withKubeConfig(caCertificate: '', clusterName: '', contextName: '', credentialsId: 'kubernetes', namespace: '', restrictKubeConfigAccess: false, serverUrl: '') {
                        sh 'kubectl apply -f .'
                    }
                }
            }
        }
    }
}
