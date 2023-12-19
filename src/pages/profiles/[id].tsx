import type {
  GetStaticPaths,
  GetStaticPropsContext,
  InferGetStaticPropsType,
  NextPage,
} from "next";
import { useSession } from "next-auth/react";
import ErrorPage from "next/error";
import Head from "next/head";
import Link from "next/link";
import { VscArrowLeft } from "react-icons/vsc";
import Button from "~/components/button";
import IconHoverEffect from "~/components/icon-hover-effect";
import InfiniteTweetList from "~/components/infinite-tweet-list";
import ProfileImage from "~/components/profile-image";
import { generateServerSideHelper } from "~/server/api/ssgHelper";
import { api } from "~/utils/api";

const ProfilePage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({
  id,
}) => {
  const { data: profile } = api.profile.getById.useQuery({ id });

  const trpcUtils = api.useUtils();

  const { mutate, isLoading } = api.profile.toggleFollow.useMutation({
    onSuccess: ({ addedFollow }) => {
      trpcUtils.profile.getById.setData({ id }, (oldData) => {
        if (!oldData) {
          return;
        }

        const countModifier = addedFollow ? 1 : -1;

        return {
          ...oldData,
          isFollowing: addedFollow,
          followersCount: oldData.followersCount + countModifier,
        };
      });
    },
  });

  const tweets = api.tweet.infiniteProfileFeed.useInfiniteQuery(
    {
      userId: id,
    },
    { getNextPageParam: (lastPage) => lastPage.nextCursor },
  );

  if (!profile ?? !profile?.name) {
    return <ErrorPage statusCode={404} />;
  }

  return (
    <>
      <Head>
        <title>{`Twitter Clone - ${profile.name}`}</title>
      </Head>
      <header className="sticky top-0 z-10 flex items-center border-b bg-white px-4 py-2">
        <Link href=".." className="mr-2">
          <IconHoverEffect>
            <VscArrowLeft className="h-6 w-6" />
          </IconHoverEffect>
        </Link>
        <ProfileImage src={profile.image} className="flex-shrink-0" />
        <div className="ml-2 flex-grow">
          <h1 className="text-lg font-bold">{profile.name}</h1>
          <div className="text-gray-500">
            {`${profile.tweetsCount} ${getPlural(
              profile.tweetsCount,
              "Tweet",
              "Tweets",
            )} - ${profile.followersCount} ${getPlural(
              profile.followersCount,
              "Follower",
              "Followers",
            )} - ${profile.followsCount} Following`}
          </div>
        </div>

        <FollowButton
          isFollowing={profile.isFollowing}
          isLoading={isLoading}
          userId={id}
          onClick={() => mutate({ userId: id })}
        />
      </header>

      <main>
        <InfiniteTweetList
          tweets={tweets.data?.pages.flatMap((page) => page.tweets)}
          isError={tweets.isError}
          isLoading={tweets.isLoading}
          hasMore={tweets.hasNextPage}
          fetchNewTweets={tweets.fetchNextPage}
        />
      </main>
    </>
  );
};

function FollowButton({
  isFollowing,
  isLoading,
  userId,
  onClick,
}: {
  userId: string;
  isFollowing: boolean;
  isLoading: boolean;
  onClick: () => void;
}) {
  const session = useSession();

  if (session.status !== "authenticated" || session.data.user.id === userId) {
    return null;
  }

  return (
    <Button disabled={isLoading} onClick={onClick} small gray={isFollowing}>
      {isFollowing ? "Unfollow" : "Follow"}
    </Button>
  );
}

const pluralRules = new Intl.PluralRules();

function getPlural(num: number, singular: string, plural: string) {
  return pluralRules.select(num) === "one" ? singular : plural;
}

export async function getStaticProps(
  context: GetStaticPropsContext<{ id: string }>,
) {
  const id = context.params?.id;

  if (!id) {
    return {
      redirect: {
        destination: "/",
      },
    };
  }

  const ssg = generateServerSideHelper();
  await ssg.profile.getById.prefetch({ id });

  return {
    props: {
      id,
      trpcState: ssg.dehydrate(),
    },
  };
}

export const getStaticPaths: GetStaticPaths = () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};

export default ProfilePage;
