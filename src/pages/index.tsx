import { GetStaticProps } from 'next';
import Link from 'next/link';
import { useState } from 'react';
import { FiCalendar, FiUser } from 'react-icons/fi';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import Prismic from '@prismicio/client';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [pagination, setPagination] = useState(postsPagination);

  function loadMorePosts(): void {
    fetch(pagination.next_page, {})
      .then(response => {
        return response.json();
      })
      .then(result => {
        const newPagination: PostPagination = {
          next_page: result.next_page,
          results: [...pagination.results, ...result.results],
        };
        setPagination(newPagination);
      })
      .catch(error => {
        // eslint-disable-next-line no-console
        return console.log(error.message);
      });
  }
  return (
    <main className={commonStyles.contentContainer}>
      {pagination.results.map(post => (
        <div key={post.uid} className={styles.posts}>
          <Link href={`/post/${post.uid}`}>
            <a>
              <h1>{post.data.title}</h1>
            </a>
          </Link>
          <h2>{post.data.subtitle}</h2>
          <div className={styles.postInfo}>
            <FiCalendar size="1.2rem" />
            <time>
              {format(new Date(post.first_publication_date), 'PP', {
                locale: ptBR,
              })}
            </time>
            <FiUser size="1.2rem" />
            <span>{post.data.author}</span>
          </div>
        </div>
      ))}

      {pagination.next_page && (
        <button
          type="button"
          onClick={() => loadMorePosts()}
          className={styles.loadMoreButton}
        >
          Carregar mais posts
        </button>
      )}
    </main>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    Prismic.predicates.at('document.type', 'posts'),
    {
      pageSize: 5,
      orderings: '[document.first_publication_date desc]',
    }
  );
  return {
    props: {
      postsPagination: postsResponse,
    },
  };
};
