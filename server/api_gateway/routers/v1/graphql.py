import graphene
from graphene import ObjectType, String, Int, Float, List, DateTime
from fastapi import APIRouter, Request
from nameko.standalone.rpc import ClusterRpcProxy
from graphql import GraphQLError
import logging
import random
import anyio
from config import CONFIG

logger = logging.getLogger(__name__)

class CourseType(ObjectType):
    id = String()
    title = String()
    description = String()
    instructor = String()
    level = String()
    tags = List(String)
    price = Int()
    rating = Float()
    image = String()

class MentorType(ObjectType):
    id = String()
    name = String()
    field = String()
    experience = String()
    image = String()

class AdsType(ObjectType):
    id = String()
    title = String()
    description = String()
    status = String()
    budget = Float()
    image = String()
    color = String()
    created_by = String()
    created_at = DateTime()

class PlacementType(ObjectType):
    id = String()
    title = String()
    description = String()
    image = String()
    company = String()
    role = String()
    location = String()
    salary = Float()

class PaginatedCourses(ObjectType):
    items = List(CourseType)
    total = Int()

class PaginatedMentors(ObjectType):
    items = List(MentorType)
    total = Int()

class PaginatedPlacements(ObjectType):
    items = List(PlacementType)
    total = Int()

class Query(ObjectType):
    courses = graphene.Field(PaginatedCourses, offset=Int(default_value=0), limit=Int(default_value=4))
    mentors = graphene.Field(PaginatedMentors, offset=Int(default_value=0), limit=Int(default_value=4))
    placements = graphene.Field(PaginatedPlacements, offset=Int(default_value=0), limit=Int(default_value=4))
    ads = List(AdsType)

    def resolve_courses(self, info, offset, limit):
        try:
            response = info.context.get("rpc_response", {})
            courses_data = response.get('courses', {'items': [], 'total': 0})
            return PaginatedCourses(
                items=[
                    CourseType(
                        id=str(course.get('_id', '')),
                        title=course.get('title', 'No Title'),
                        description=course.get('description', 'No Description Available'),
                        instructor=course.get('instructor', {}).get('name', 'Unknown'),
                        level=course.get('level', 'Unknown'),
                        tags=course.get('tags', []),
                        price=int(course.get('price', {}).get('customAmount', 0)),
                        rating=float(course.get('rating', {}).get('average', 4.5)),
                        image=course.get('thumbnail', {}).get('key')
                    )
                    for course in courses_data['items']
                ],
                total=courses_data['total']
            )
        except Exception as e:
            logger.error("Error resolving courses: %s", e)
            raise GraphQLError(f"Error resolving courses: {e}")

    def resolve_mentors(self, info, offset, limit):
        try:
            response = info.context.get("rpc_response", {})
            mentors_data = response.get('mentors', {'items': [], 'total': 0})
            return PaginatedMentors(
                items=[
                    MentorType(
                        id=str(mentor.get('id', '')),
                        name=mentor.get('name', 'Unknown'),
                        field=mentor.get('field', 'Unknown'),
                        experience=mentor.get('experience', 'N/A'),
                        image=mentor.get('image', '')
                    )
                    for mentor in mentors_data['items']
                ],
                total=mentors_data['total']
            )
        except Exception as e:
            logger.error("Error resolving mentors: %s", e)
            raise GraphQLError(f"Error resolving mentors: {e}")

    def resolve_placements(self, info, offset, limit):
        try:
            response = info.context.get("rpc_response", {})
            placements_data = response.get('placements', {'items': [], 'total': 0})
            return PaginatedPlacements(
                items=[
                    PlacementType(
                        id=str(placement.get('_id', '')),
                        title=placement.get('title', 'No Title'),
                        description=placement.get('description', 'No Description Available'),
                        image=placement.get('thumbnail', {}).get('key'),
                        company=placement.get('company', 'Unknown'),
                        role=placement.get('role', 'Unknown'),
                        location=placement.get('location', 'Unknown'),
                        salary=float(placement.get('salary', 0.0))
                    )
                    for placement in placements_data['items']
                ],
                total=placements_data['total']
            )
        except Exception as e:
            logger.error("Error resolving placements: %s", e)
            raise GraphQLError(f"Error resolving placements: {e}")

    def resolve_ads(self, info):
        colors = ['bg-blue-100', 'bg-green-100', 'bg-yellow-100', 'bg-purple-100', 'bg-red-100', 'bg-indigo-100']
        try:
            response = info.context.get("rpc_response", {})
            ads_data = response.get('ads', [])
            return [
                AdsType(
                    id=ad.get('id', ''),
                    title=ad.get('title', 'No Title'),
                    description=ad.get('description', 'No Description Available'),
                    status=ad.get('status', 'Unknown'),
                    budget=float(ad.get('budget', 0)),
                    image=ad.get('thumbnail', {}).get('key'),
                    color=random.choice(colors),
                    created_by=str(ad.get('created_by', '')),
                    created_at=ad.get('created_at', None)
                )
                for ad in ads_data
            ]
        except Exception as e:
            logger.error("Error resolving ads: %s", e)
            raise GraphQLError(f"Error resolving ads: {e}")

schema = graphene.Schema(query=Query)

graphql_router = APIRouter()

async def graphql_server(request: Request):
    try:
        body = await request.json()
        query = body.get("query")
        variables = body.get("variables", {})
        
        logger.info(f"Schema.py active - Received query: {query}")
        logger.info(f"Received variables: {variables}")
        
        rpc_kwargs = {}
        if 'GetHomepageData' in query:
            rpc_kwargs = {
                'coursesOffset': variables.get('coursesOffset', 0),
                'coursesLimit': variables.get('coursesLimit', 4),
                'mentorsOffset': variables.get('mentorsOffset', 0),
                'mentorsLimit': variables.get('mentorsLimit', 4),
                'placementsOffset': variables.get('placementsOffset', 0),
                'placementsLimit': variables.get('placementsLimit', 4),
                'fetchAds': True
            }
        else:
            rpc_kwargs = {
                'coursesOffset': variables.get('offset', 0) if 'courses' in query else None,
                'coursesLimit': variables.get('limit', 4) if 'courses' in query else None,
                'mentorsOffset': variables.get('offset', 0) if 'mentors' in query else None,
                'mentorsLimit': variables.get('limit', 4) if 'mentors' in query else None,
                'placementsOffset': variables.get('offset', 0) if 'placements' in query else None,
                'placementsLimit': variables.get('limit', 4) if 'placements' in query else None,
                'fetchAds': 'ads' in query
            }
        
        filtered_kwargs = {k: v for k, v in rpc_kwargs.items() if v is not None or k == 'fetchAds'}
        logger.info(f"Calling RPC with filtered kwargs: {filtered_kwargs}")

        def make_rpc_call():
            with ClusterRpcProxy(CONFIG) as rpc:
                return rpc.homepage_service.graphql(**filtered_kwargs)

        with anyio.fail_after(10.0):
            rpc_response = await anyio.to_thread.run_sync(make_rpc_call)

        logger.info(f"RPC response: {rpc_response}")

        result = schema.execute(
            query,
            context_value={'rpc_response': rpc_response},
            variable_values=variables
        )

        if result.errors:
            logger.error(f"GraphQL execution errors: {result.errors}")
            return {"errors": [str(e) for e in result.errors]}
        
        logger.info(f"GraphQL result: {result.data}")
        return {"data": result.data}
    except anyio.ExceptionGroup as eg:
        logger.error("GraphQL RPC call timed out or failed: %s", eg)
        return {"errors": ["GraphQL request timed out or failed"]}
    except Exception as e:
        logger.error("Error processing GraphQL request: %s", e)
        return {"errors": [str(e)]}

graphql_router.post("/graphql")(graphql_server)