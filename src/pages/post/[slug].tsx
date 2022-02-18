import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return <p>Carregando...</p>;
  }

  const timeReading = (): number => {
    const headingWords = post.data.content.map(content => {
      const headingWordsLength = content.heading.split(' ').length;
      return headingWordsLength;
    });

    const headingWordsTotal = headingWords.reduce((prev, current) => {
      const total = (prev += current);
      return total;
    }, 0);

    const bodyWords = post.data.content.map(content => {
      const bodyWordsLength = RichText.asText(content.body).split(' ').length;
      return bodyWordsLength;
    });

    const bodyWordsTotal = bodyWords.reduce((prev, current) => {
      const total = (prev += current);
      return total;
    }, 0);

    const timeNeeded = Math.ceil((headingWordsTotal + bodyWordsTotal) / 200);

    return timeNeeded;
  };

  return (
    <>
      <Head>
        <title> {post.data.title} | Spacetraveling</title>
      </Head>
      <img src={post.data.banner.url} width="100%" alt="Banner da publicação" />
      <main className={`${commonStyles.contentContainer} ${styles.article}`}>
        <h1>{post.data.title}</h1>
        <div className={styles.postInfo}>
          <FiCalendar size="1.2rem" />
          <time>
            {format(new Date(post.first_publication_date), 'PP', {
              locale: ptBR,
            })}
          </time>
          <FiUser size="1.2rem" />
          <span>{post.data.author}</span>
          <FiClock size="1.2rem" />
          <span>{`${timeReading()} min`}</span>
        </div>
        {post.data.content.map(content => {
          return (
            <section key={content.heading}>
              <h2>{content.heading}</h2>
              {content.body.map(body => (
                <p key={body.text}>{body.text}</p>
              ))}
            </section>
          );
        })}
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.predicates.at('document.type', 'posts')
  );

  const path = posts.results.map(post => {
    return { params: { slug: post.uid } };
  });

  return {
    paths: path,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  return {
    props: {
      post: response,
    },
  };
};
