async function loadContent(language = 'en') {
  try {
    const contentFile = language === 'ja' ? 'content_second_language.yaml' : 'content.yaml';
    const response = await fetch(contentFile);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const yamlText = await response.text();
    const content = jsyaml.load(yamlText);

    // Inject content into HTML
    document.title = content.title;
    document.querySelector('meta[name="description"]').setAttribute('content', content.description);

    // Header links
    const headerLinks = document.querySelector('.header__links');
    headerLinks.innerHTML = '';
    content.header.links.forEach(link => {
      const li = document.createElement('li');
      li.classList.add('header__link-wrapper');
      li.innerHTML = `<a href="${link.href}" class="header__link" ${link.text === 'CV' ? 'target="_blank"' : ''}>${link.text}</a>`;
      headerLinks.appendChild(li);

      // Add event listeners for language switching
      if (link.text === '日本語') {
        li.addEventListener('click', (event) => {
          event.preventDefault();
          loadContent('ja');
        });
      } else if (link.text === 'English') {
        li.addEventListener('click', (event) => {
          event.preventDefault();
          loadContent('en');
        });
      }
    });

    const sm_menu_links = document.querySelector('.header__sm-menu-links');
    sm_menu_links.innerHTML = '';
    content.header.links.forEach(link => {
      const li = document.createElement('li');
      li.classList.add('header__sm-menu-link');
      li.innerHTML = `<a href="${link.href}" ${link.text === 'CV' ? 'target="_blank"' : ''}>${link.text}</a>`;
      sm_menu_links.appendChild(li);

      // Add event listeners for language switching
      if (link.text === '日本語') {
        li.addEventListener('click', (event) => {
          event.preventDefault();
          loadContent('ja');
        });
      } else if (link.text === 'English') {
        li.addEventListener('click', (event) => {
          event.preventDefault();
          loadContent('en');
        });
      }
    });

    // About Section
    document.querySelector('#about .heading-sec__main').innerText = content.about.mainHeading;
    document.querySelector('#about .heading-sec__sub').innerText = content.about.subHeading;
    document.querySelector('#about .about__content-details-para').innerText = content.about.content;
    const aboutSocialContainer = document.querySelector('#about .home-hero__socials');
    aboutSocialContainer.innerHTML = '';
    content.footer.socialLinks.forEach(social => {
      const a = document.createElement('a');
      a.href = social.href;
      a.target = "_blank";
      a.rel = "noreferrer";
      a.classList.add('mr-3'); // Adding margin class for spacing
      a.innerHTML = `<img class="main-footer__icon" src="${social.iconSrc}" alt="icon" />`;
      aboutSocialContainer.appendChild(a);
    });

    // About Image
    const aboutImage = document.querySelector('#about .about__content-image');
    aboutImage.src = content.about.image.src;
    aboutImage.alt = content.about.image.alt;

    // Clear existing project sections
    const existingProjectsContainer = document.querySelector('#projects');
    if (existingProjectsContainer) {
      existingProjectsContainer.remove();
    }

    // Clear existing project rows
    const existingProjectRows = document.querySelectorAll('.projects__row');
    existingProjectRows.forEach(row => row.remove());

    // Projects Section
    const projectsContainer = document.createElement('div');
    projectsContainer.innerHTML = `
      <section id="projects" class="projects sec-pad">
        <div class="container">
          <h2 class="heading heading-sec heading-sec__mb-med">
            <span class="heading-sec__main">${content.projectsSection.mainHeading}</span>
            <span class="heading-sec__sub">${content.projectsSection.subHeading}</span>
          </h2>
        </div>
      </section>
    `;
    content.projects.forEach(project => {
      const projectSection = document.createElement('section');
      projectSection.id = project.sectionID;
      projectSection.classList.add('projects', 'sec-pad', project.sectionClass);
      projectSection.innerHTML = `
        <div class="main-container">
          <div class="projects__content">
            <div class="projects__row">
              <div class="projects__row-img-cont">
                <img src="${project.imgSrc}" alt="${project.imgAlt}" class="projects__row-img" loading="lazy" />
              </div>
              <div class="projects__row-content">
                <h3 class="projects__row-content-title">${project.title}</h3>
                <p class="projects__row-content-desc ">${project.description}</p>
                <a href="${project.link.href}" class="btn btn--med btn--theme dynamicBgClr" target="_blank">${project.link.text}</a>
              </div>
            </div>
          </div>
        </div>
      `;
      projectsContainer.appendChild(projectSection);
    });

    // Quiz Section
    const quizSection = document.getElementById('quiz');
    if (content.quiz.play_contextofolio) {
      quizSection.style.display = 'block';
      document.getElementById('quiz-main-heading').innerText = content.quiz.mainHeading;
      document.getElementById('howToPlayText').innerText = content.quiz.howToPlay;
      document.getElementById('quizbtn').innerText = content.quiz.submit_btn;
    } else {
      quizSection.style.display = 'none';
    }

    // Insert projects container before the quiz section
    quizSection.insertAdjacentElement('beforebegin', projectsContainer);

    // Footer
    document.getElementById('footer-description').innerText = content.footer.description;
    document.getElementById('footer-portofolio-link').innerText = content.footer.portofolio_link;

    // Social links
    const footerSocialContainer = document.querySelector('.main-footer__social-cont');
    footerSocialContainer.innerHTML = '';
    content.footer.socialLinks.forEach(social => {
      const a = document.createElement('a');
      a.href = social.href;
      a.target = "_blank";
      a.rel = "noreferrer";
      a.classList.add('mr-3'); // Adding margin class for spacing
      a.innerHTML = `<img class="main-footer__icon" src="${social.iconSrc}" alt="icon" />`;
      footerSocialContainer.appendChild(a);
    });

  } catch (error) {
    console.error('Error loading content:', error);
  }
}

document.addEventListener('DOMContentLoaded', () => loadContent());
